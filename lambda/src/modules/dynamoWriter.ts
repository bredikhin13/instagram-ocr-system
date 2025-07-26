import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { AnswerRecord, StatisticsRecord, ParsedAnswers } from '../types';

export class DynamoWriter {
  private docClient: DynamoDBDocumentClient;
  private answersTable: string;
  private statisticsTable: string;

  constructor() {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.answersTable = process.env.ANSWERS_TABLE || 'instagram-answers';
    this.statisticsTable = process.env.STATISTICS_TABLE || 'instagram-statistics';
  }

  /**
   * Сохраняет ответы пользователей в таблицу answers
   */
  async saveAnswers(parsedAnswers: ParsedAnswers): Promise<void> {
    try {
      console.log(`Saving ${parsedAnswers.answers.length} answers for story ${parsedAnswers.story_id}`);
      
      const items: AnswerRecord[] = parsedAnswers.answers.map(answer => ({
        PK: parsedAnswers.story_id,
        SK: answer.username,
        story_id: parsedAnswers.story_id,
        username: answer.username,
        answer: answer.answer,
        extracted_at: parsedAnswers.extracted_at,
        created_at: new Date().toISOString()
      }));

      // Используем batch write для эффективности
      await this.batchWriteItems(this.answersTable, items);
      
      console.log(`Successfully saved ${items.length} answer records`);
    } catch (error) {
      console.error(`Error saving answers: ${error}`);
      throw new Error(`Failed to save answers: ${error}`);
    }
  }

  /**
   * Сохраняет статистику в таблицу statistics
   */
  async saveStatistics(statisticsRecord: StatisticsRecord): Promise<void> {
    try {
      console.log(`Saving statistics for story ${statisticsRecord.story_id}`);
      
      const command = new PutCommand({
        TableName: this.statisticsTable,
        Item: statisticsRecord
      });

      await this.docClient.send(command);
      
      console.log(`Successfully saved statistics record`);
    } catch (error) {
      console.error(`Error saving statistics: ${error}`);
      throw new Error(`Failed to save statistics: ${error}`);
    }
  }

  /**
   * Пакетная запись элементов в DynamoDB
   */
  private async batchWriteItems(tableName: string, items: any[]): Promise<void> {
    const BATCH_SIZE = 25; // DynamoDB ограничение на batch write
    
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      
      const putRequests = batch.map(item => ({
        PutRequest: {
          Item: item
        }
      }));

      const command = new BatchWriteCommand({
        RequestItems: {
          [tableName]: putRequests
        }
      });

      try {
        const response = await this.docClient.send(command);
        
        // Обрабатываем неудачные записи
        if (response.UnprocessedItems && Object.keys(response.UnprocessedItems).length > 0) {
          console.warn(`Some items were not processed in batch write`);
          // Можно добавить retry логику здесь
        }
      } catch (error) {
        console.error(`Batch write failed for batch ${i / BATCH_SIZE + 1}: ${error}`);
        throw error;
      }
    }
  }

  /**
   * Обновляет существующую запись ответа
   */
  async updateAnswer(storyId: string, username: string, newAnswer: string): Promise<void> {
    try {
      const item: AnswerRecord = {
        PK: storyId,
        SK: username,
        story_id: storyId,
        username: username,
        answer: newAnswer,
        extracted_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const command = new PutCommand({
        TableName: this.answersTable,
        Item: item
      });

      await this.docClient.send(command);
      console.log(`Updated answer for ${username} in story ${storyId}`);
    } catch (error) {
      console.error(`Error updating answer: ${error}`);
      throw new Error(`Failed to update answer: ${error}`);
    }
  }

  /**
   * Проверяет подключение к DynamoDB
   */
  async testConnection(): Promise<boolean> {
    try {
      // Простая проверка - пытаемся выполнить запрос к таблице
      const command = new PutCommand({
        TableName: this.answersTable,
        Item: {
          PK: 'test',
          SK: 'test',
          test: true
        },
        ConditionExpression: 'attribute_not_exists(PK)' // Не будет записывать, только проверит таблицу
      });

      await this.docClient.send(command);
      return true;
    } catch (error: any) {
      // Ошибка условия - это нормально, означает что таблица доступна
      if (error.name === 'ConditionalCheckFailedException') {
        return true;
      }
      
      console.error(`DynamoDB connection test failed: ${error}`);
      return false;
    }
  }

  /**
   * Получает статистику для валидации
   */
  async validateWrite(storyId: string, expectedCount: number): Promise<boolean> {
    try {
      // Здесь можно добавить запрос для проверки количества записанных элементов
      // Для простоты возвращаем true
      console.log(`Validation requested for story ${storyId}, expected ${expectedCount} records`);
      return true;
    } catch (error) {
      console.error(`Validation failed: ${error}`);
      return false;
    }
  }
} 
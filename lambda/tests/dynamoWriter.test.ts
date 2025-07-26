import { DynamoWriter } from '../src/modules/dynamoWriter';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { ParsedAnswers, StatisticsRecord } from '../src/types';

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('DynamoWriter', () => {
  let dynamoWriter: DynamoWriter;

  beforeEach(() => {
    dynamoWriter = new DynamoWriter();
    dynamoMock.reset();
  });

  describe('saveAnswers', () => {
    it('should save answers using batch write', async () => {
      const parsedAnswers: ParsedAnswers = {
        story_id: 'test-story',
        answers: [
          { username: 'user1', answer: 'answer1', timestamp: '2024-01-01' },
          { username: 'user2', answer: 'answer2', timestamp: '2024-01-01' }
        ],
        total_answers: 2,
        extracted_at: '2024-01-01'
      };

      dynamoMock.on(BatchWriteCommand).resolves({
        UnprocessedItems: {}
      });

      await dynamoWriter.saveAnswers(parsedAnswers);

      expect(dynamoMock.commandCalls(BatchWriteCommand)).toHaveLength(1);
      const call = dynamoMock.commandCalls(BatchWriteCommand)[0];
      expect(call.args[0].input.RequestItems).toBeDefined();
    });

    it('should handle large batches by splitting them', async () => {
      const answers = Array.from({ length: 30 }, (_, i) => ({
        username: `user${i}`,
        answer: `answer${i}`,
        timestamp: '2024-01-01'
      }));

      const parsedAnswers: ParsedAnswers = {
        story_id: 'test-story',
        answers,
        total_answers: 30,
        extracted_at: '2024-01-01'
      };

      dynamoMock.on(BatchWriteCommand).resolves({
        UnprocessedItems: {}
      });

      await dynamoWriter.saveAnswers(parsedAnswers);

      // Должно быть 2 batch write команды (25 + 5)
      expect(dynamoMock.commandCalls(BatchWriteCommand)).toHaveLength(2);
    });

    it('should handle batch write errors', async () => {
      const parsedAnswers: ParsedAnswers = {
        story_id: 'test-story',
        answers: [{ username: 'user1', answer: 'answer1', timestamp: '2024-01-01' }],
        total_answers: 1,
        extracted_at: '2024-01-01'
      };

      dynamoMock.on(BatchWriteCommand).rejects(new Error('DynamoDB Error'));

      await expect(dynamoWriter.saveAnswers(parsedAnswers))
        .rejects.toThrow('Failed to save answers');
    });

    it('should warn about unprocessed items', async () => {
      const parsedAnswers: ParsedAnswers = {
        story_id: 'test-story',
        answers: [{ username: 'user1', answer: 'answer1', timestamp: '2024-01-01' }],
        total_answers: 1,
        extracted_at: '2024-01-01'
      };

      dynamoMock.on(BatchWriteCommand).resolves({
        UnprocessedItems: {
          'test-table': [{ PutRequest: { Item: {} } }]
        }
      });

      const consoleSpy = jest.spyOn(console, 'warn');
      
      await dynamoWriter.saveAnswers(parsedAnswers);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Some items were not processed')
      );
    });
  });

  describe('saveStatistics', () => {
    it('should save statistics record', async () => {
      const statistics: StatisticsRecord = {
        PK: 'test-story',
        story_id: 'test-story',
        total_answers: 5,
        unique_answers: 3,
        answer_distribution: { 'answer1': 3, 'answer2': 2 },
        top_answers: [
          { answer: 'answer1', count: 3, percentage: 60 },
          { answer: 'answer2', count: 2, percentage: 40 }
        ],
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      dynamoMock.on(PutCommand).resolves({});

      await dynamoWriter.saveStatistics(statistics);

      expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(1);
      const call = dynamoMock.commandCalls(PutCommand)[0];
      expect(call.args[0].input.Item).toEqual(statistics);
    });

    it('should handle statistics save errors', async () => {
      const statistics: StatisticsRecord = {
        PK: 'test-story',
        story_id: 'test-story',
        total_answers: 0,
        unique_answers: 0,
        answer_distribution: {},
        top_answers: [],
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      dynamoMock.on(PutCommand).rejects(new Error('DynamoDB Error'));

      await expect(dynamoWriter.saveStatistics(statistics))
        .rejects.toThrow('Failed to save statistics');
    });
  });

  describe('updateAnswer', () => {
    it('should update existing answer', async () => {
      dynamoMock.on(PutCommand).resolves({});

      await dynamoWriter.updateAnswer('test-story', 'user1', 'new-answer');

      expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(1);
      const call = dynamoMock.commandCalls(PutCommand)[0];
      expect(call.args[0].input.Item).toMatchObject({
        PK: 'test-story',
        SK: 'user1',
        story_id: 'test-story',
        username: 'user1',
        answer: 'new-answer'
      });
    });

    it('should handle update errors', async () => {
      dynamoMock.on(PutCommand).rejects(new Error('Update failed'));

      await expect(dynamoWriter.updateAnswer('test-story', 'user1', 'new-answer'))
        .rejects.toThrow('Failed to update answer');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection test', async () => {
      // Мокируем условную проверку как будто запись уже существует
      dynamoMock.on(PutCommand).rejects({
        name: 'ConditionalCheckFailedException'
      });

      const result = await dynamoWriter.testConnection();

      expect(result).toBe(true);
    });

    it('should return true even if test item gets written', async () => {
      dynamoMock.on(PutCommand).resolves({});

      const result = await dynamoWriter.testConnection();

      expect(result).toBe(true);
    });

    it('should return false for connection errors', async () => {
      dynamoMock.on(PutCommand).rejects(new Error('Connection failed'));

      const result = await dynamoWriter.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('validateWrite', () => {
    it('should validate write operation', async () => {
      const result = await dynamoWriter.validateWrite('test-story', 5);

      expect(result).toBe(true);
    });
  });

  describe('private methods', () => {
    it('should handle batch size correctly', async () => {
      const dynamoWriterAny = dynamoWriter as any;
      const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));

      dynamoMock.on(BatchWriteCommand).resolves({
        UnprocessedItems: {}
      });

      await dynamoWriterAny.batchWriteItems('test-table', items);

      // 50 items = 2 batches (25 + 25)
      expect(dynamoMock.commandCalls(BatchWriteCommand)).toHaveLength(2);
    });
  });
}); 
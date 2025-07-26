import { S3Event, Context, S3Handler } from 'aws-lambda';
import { S3Reader } from './modules/s3Reader';
import { OCRService } from './modules/ocr';
import { AnswerParser } from './modules/parser';
import { DynamoWriter } from './modules/dynamoWriter';
import { StatisticsCalculator } from './modules/statistics';

/**
 * Основная Lambda-функция для обработки OCR Instagram Stories
 */
export const handler: S3Handler = async (event: S3Event, context: Context) => {
  console.log('Lambda function started', JSON.stringify(event, null, 2));
  
  // Инициализируем сервисы
  const s3Reader = new S3Reader();
  const ocrService = new OCRService();
  const parser = new AnswerParser();
  const dynamoWriter = new DynamoWriter();
  const statisticsCalculator = new StatisticsCalculator();
  
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = record.s3.object.key;
      
      console.log(`Processing file: s3://${bucket}/${key}`);
      
      // Проверяем, что это изображение
      if (!s3Reader.isImageFile(key)) {
        console.log(`Skipping non-image file: ${key}`);
        continue;
      }
      
      // Извлекаем story_id из пути
      const storyId = s3Reader.extractStoryId(key);
      if (!storyId) {
        console.warn(`Could not extract story_id from key: ${key}`);
        continue;
      }
      
      console.log(`Processing story: ${storyId}`);
      
      try {
        // 1. Читаем изображение из S3
        const imageBuffer = await s3Reader.readImage(bucket, key);
        
        // 2. Выполняем OCR обработку
        const ocrResult = await ocrService.extractTextFromImage(imageBuffer);
        
        if (ocrResult.text.length === 0) {
          console.warn(`No text found in image for story ${storyId}`);
          continue;
        }
        
        // 3. Парсим ответы пользователей
        const parsedAnswers = parser.parseAnswersFromText(ocrResult, storyId);
        
        if (parsedAnswers.total_answers === 0) {
          console.warn(`No user answers found in story ${storyId}`);
          continue;
        }
        
        // 4. Читаем story.json если доступен
        const storyData = await s3Reader.readStoryJson(bucket, storyId);
        if (storyData) {
          console.log(`Story metadata loaded for ${storyId}: ${storyData.question}`);
        }
        
        // 5. Вычисляем статистику
        const statistics = statisticsCalculator.calculateStatistics(parsedAnswers);
        
        // 6. Сохраняем данные в DynamoDB
        await Promise.all([
          dynamoWriter.saveAnswers(parsedAnswers),
          dynamoWriter.saveStatistics(statistics)
        ]);
        
        // 7. Анализируем качество извлечения
        const qualityAnalysis = parser.analyzeExtractionQuality(parsedAnswers, ocrResult.confidence);
        console.log(`Extraction quality for ${storyId}: ${qualityAnalysis.quality} (${qualityAnalysis.confidence})`);
        
        if (qualityAnalysis.issues.length > 0) {
          console.warn(`Quality issues: ${qualityAnalysis.issues.join(', ')}`);
        }
        
        // 8. Создаем краткую сводку
        const summary = statisticsCalculator.createSummary(statistics);
        console.log(`Processing completed for ${storyId}: ${summary}`);
        
      } catch (storyError) {
        console.error(`Error processing story ${storyId}: ${storyError}`);
        // Продолжаем обработку других файлов
      }
    }
    
    console.log('Lambda function completed successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Processing completed',
        processedFiles: event.Records.length
      })
    };
    
  } catch (error) {
    console.error('Lambda function failed:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Processing failed',
        message: error instanceof Error ? error.message : String(error)
      })
    };
  }
};

/**
 * Lambda-функция для API Gateway - получение статистики
 */
export const getStatisticsHandler = async (event: any, context: Context) => {
  console.log('Get statistics API called', JSON.stringify(event, null, 2));
  
  try {
    const storyId = event.pathParameters?.story_id;
    
    if (!storyId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'story_id parameter is required'
        })
      };
    }
    
    // Здесь можно добавить чтение статистики из DynamoDB
    // Для демонстрации возвращаем заглушку
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        story_id: storyId,
        message: 'Statistics retrieval not implemented yet'
      })
    };
    
  } catch (error) {
    console.error('Get statistics API failed:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      })
    };
  }
};

/**
 * Lambda-функция для API Gateway - получение списка stories
 */
export const getStoriesHandler = async (event: any, context: Context) => {
  console.log('Get stories API called', JSON.stringify(event, null, 2));
  
  try {
    // Здесь можно добавить чтение списка stories из DynamoDB
    // Для демонстрации возвращаем заглушку
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        stories: [],
        message: 'Stories list retrieval not implemented yet'
      })
    };
    
  } catch (error) {
    console.error('Get stories API failed:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      })
    };
  }
}; 
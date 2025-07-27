import { ImageAnnotatorClient } from '@google-cloud/vision';
import { OCRResult } from '../types';

export class OCRService {
  private visionClient: ImageAnnotatorClient;

  constructor() {
    // Инициализация Google Vision клиента
    // Поддерживает JSON credentials из переменной окружения или файл
    this.visionClient = this.createVisionClient();
  }

  private createVisionClient(): ImageAnnotatorClient {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_VISION_API_KEY environment variable is required');
    }

    try {
      // Пытаемся парсить как JSON (Service Account)
      const credentials = JSON.parse(apiKey);
      
      console.log('Using Google Vision with Service Account credentials');
      return new ImageAnnotatorClient({
        credentials,
        projectId: credentials.project_id
      });
      
    } catch (parseError) {
      // Если не JSON, используем как API Key
      console.log('Using Google Vision with API Key');
      return new ImageAnnotatorClient({
        apiKey: apiKey.trim()
      });
    }
  }

  /**
   * Извлекает текст из изображения используя Google Vision API
   */
  async extractTextFromImage(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      console.log(`Starting OCR processing for image (${imageBuffer.length} bytes)`);
      
      const [result] = await this.visionClient.textDetection({
        image: {
          content: imageBuffer.toString('base64')
        }
      });

      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0) {
        console.warn('No text detected in image');
        return {
          text: '',
          confidence: 0,
          boundingBoxes: []
        };
      }

      // Первая annotation содержит весь текст
      const fullTextAnnotation = detections[0];
      const fullText = fullTextAnnotation.description || '';
      
      // Вычисляем общую уверенность на основе всех детекций
      let totalConfidence = 0;
      let confidenceCount = 0;
      
      const boundingBoxes = detections.slice(1).map(detection => {
        if (detection.boundingPoly && detection.boundingPoly.vertices) {
          const vertices = detection.boundingPoly.vertices.map(vertex => ({
            x: vertex.x || 0,
            y: vertex.y || 0
          }));
          
          // Добавляем confidence если доступен
          if (detection.confidence !== undefined && detection.confidence !== null) {
            totalConfidence += detection.confidence;
            confidenceCount++;
          }
          
          return {
            text: detection.description || '',
            vertices
          };
        }
        return null;
      }).filter(box => box !== null) as Array<{
        text: string;
        vertices: Array<{ x: number; y: number }>;
      }>;

      const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.8;
      
      console.log(`OCR completed. Extracted text length: ${fullText.length}, confidence: ${averageConfidence}`);
      
      return {
        text: fullText,
        confidence: averageConfidence,
        boundingBoxes
      };
    } catch (error) {
      console.error(`Error during OCR processing: ${error}`);
      throw new Error(`OCR processing failed: ${error}`);
    }
  }

  /**
   * Предобработка изображения для улучшения качества OCR
   */
  preprocessImage(imageBuffer: Buffer): Buffer {
    // Здесь можно добавить предобработку изображения:
    // - изменение размера
    // - повышение контраста
    // - удаление шума
    // Пока возвращаем исходный буфер
    return imageBuffer;
  }

  /**
   * Фильтрует текст, удаляя нерелевантные элементы
   */
  filterText(text: string): string {
    // Удаляем лишние пробелы и переносы строк
    const cleanText = text
      .replace(/\s+/g, ' ')
      .trim();
    
    // Можно добавить дополнительную фильтрацию:
    // - удаление эмодзи
    // - фильтрация по языку
    // - удаление системных элементов UI
    
    return cleanText;
  }

  /**
   * Проверяет, содержит ли текст ответы пользователей
   */
  hasUserAnswers(text: string): boolean {
    // Простая эвристика для определения наличия ответов
    const indicators = [
      'ответ', 'answer', 'says', 'говорит',
      '@', 'username', 'пользователь'
    ];
    
    const lowerText = text.toLowerCase();
    return indicators.some(indicator => lowerText.includes(indicator));
  }
} 
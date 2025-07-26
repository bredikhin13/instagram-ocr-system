import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { StoryData } from '../types';

export class S3Reader {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
  }

  /**
   * Читает изображение из S3 и возвращает Buffer
   */
  async readImage(bucket: string, key: string): Promise<Buffer> {
    try {
      console.log(`Reading image from S3: s3://${bucket}/${key}`);
      
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error(`No body in S3 response for ${key}`);
      }

      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      console.log(`Successfully read image: ${buffer.length} bytes`);
      
      return buffer;
    } catch (error) {
      console.error(`Error reading image from S3: ${error}`);
      throw new Error(`Failed to read image from S3: ${error}`);
    }
  }

  /**
   * Читает story.json файл из S3 и парсит его
   */
  async readStoryJson(bucket: string, storyId: string): Promise<StoryData | null> {
    try {
      const key = `${storyId}/story.json`;
      console.log(`Reading story.json from S3: s3://${bucket}/${key}`);
      
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        console.warn(`No story.json found for story ${storyId}`);
        return null;
      }

      const bodyString = await response.Body.transformToString();
      const storyData: StoryData = JSON.parse(bodyString);
      
      console.log(`Successfully parsed story.json for ${storyId}`);
      return storyData;
    } catch (error) {
      console.error(`Error reading story.json: ${error}`);
      // Не бросаем ошибку, так как story.json может отсутствовать
      return null;
    }
  }

  /**
   * Проверяет, является ли файл изображением
   */
  isImageFile(key: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    const lowercaseKey = key.toLowerCase();
    return imageExtensions.some(ext => lowercaseKey.endsWith(ext));
  }

  /**
   * Извлекает story_id из ключа S3
   */
  extractStoryId(key: string): string | null {
    const parts = key.split('/');
    if (parts.length >= 2) {
      return parts[0]; // Предполагаем формат: story_id/filename
    }
    return null;
  }

  /**
   * Проверяет наличие файла в S3
   */
  async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
} 
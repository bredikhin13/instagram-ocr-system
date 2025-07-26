import { S3Reader } from '../src/modules/s3Reader';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { Readable } from 'stream';

const s3Mock = mockClient(S3Client);

describe('S3Reader', () => {
  let s3Reader: S3Reader;

  beforeEach(() => {
    s3Reader = new S3Reader();
    s3Mock.reset();
  });

  describe('readImage', () => {
    it('should read image from S3 successfully', async () => {
      const mockBuffer = Buffer.from('test image data');
      const mockStream = Readable.from([mockBuffer]);
      
      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream
      });

      const result = await s3Reader.readImage('test-bucket', 'test-key.jpg');
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('test image data');
    });

    it('should throw error when no body in response', async () => {
      s3Mock.on(GetObjectCommand).resolves({
        Body: undefined
      });

      await expect(s3Reader.readImage('test-bucket', 'test-key.jpg'))
        .rejects.toThrow('No body in S3 response for test-key.jpg');
    });

    it('should handle S3 errors', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('S3 Error'));

      await expect(s3Reader.readImage('test-bucket', 'test-key.jpg'))
        .rejects.toThrow('Failed to read image from S3');
    });
  });

  describe('readStoryJson', () => {
    it('should read and parse story.json successfully', async () => {
      const storyData = {
        story_id: 'test-story',
        user_id: 'test-user',
        created_at: '2024-01-01T00:00:00Z',
        question: 'Test question?'
      };

      const mockStream = Readable.from([JSON.stringify(storyData)]);
      
      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream
      });

      const result = await s3Reader.readStoryJson('test-bucket', 'test-story');
      
      expect(result).toEqual(storyData);
    });

    it('should return null when story.json not found', async () => {
      s3Mock.on(GetObjectCommand).resolves({
        Body: undefined
      });

      const result = await s3Reader.readStoryJson('test-bucket', 'test-story');
      
      expect(result).toBeNull();
    });

    it('should return null on S3 errors', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('Not found'));

      const result = await s3Reader.readStoryJson('test-bucket', 'test-story');
      
      expect(result).toBeNull();
    });
  });

  describe('isImageFile', () => {
    it('should return true for image extensions', () => {
      expect(s3Reader.isImageFile('test.jpg')).toBe(true);
      expect(s3Reader.isImageFile('test.jpeg')).toBe(true);
      expect(s3Reader.isImageFile('test.png')).toBe(true);
      expect(s3Reader.isImageFile('test.gif')).toBe(true);
      expect(s3Reader.isImageFile('test.bmp')).toBe(true);
      expect(s3Reader.isImageFile('TEST.JPG')).toBe(true); // case insensitive
    });

    it('should return false for non-image extensions', () => {
      expect(s3Reader.isImageFile('test.txt')).toBe(false);
      expect(s3Reader.isImageFile('test.json')).toBe(false);
      expect(s3Reader.isImageFile('test.pdf')).toBe(false);
      expect(s3Reader.isImageFile('test')).toBe(false);
    });
  });

  describe('extractStoryId', () => {
    it('should extract story_id from valid key', () => {
      expect(s3Reader.extractStoryId('story_123/image.jpg')).toBe('story_123');
      expect(s3Reader.extractStoryId('test-story/subfolder/image.png')).toBe('test-story');
    });

    it('should return null for invalid key format', () => {
      expect(s3Reader.extractStoryId('image.jpg')).toBeNull();
      expect(s3Reader.extractStoryId('')).toBeNull();
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from(['test'])
      });

      const result = await s3Reader.fileExists('test-bucket', 'test-key');
      
      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('NoSuchKey'));

      const result = await s3Reader.fileExists('test-bucket', 'test-key');
      
      expect(result).toBe(false);
    });
  });
}); 
import { AnswerParser } from '../src/modules/parser';
import { OCRResult } from '../src/types';

describe('AnswerParser', () => {
  let parser: AnswerParser;

  beforeEach(() => {
    parser = new AnswerParser();
  });

  describe('parseAnswersFromText', () => {
    it('should parse username-answer pairs from OCR text', () => {
      const ocrResult: OCRResult = {
        text: `@john ответил "Синий"
@mary ответил "Красный" 
@alice: Зеленый
@bob - Желтый`,
        confidence: 0.9,
        boundingBoxes: []
      };

      const result = parser.parseAnswersFromText(ocrResult, 'test-story');

      expect(result.story_id).toBe('test-story');
      expect(result.answers).toHaveLength(4);
      expect(result.answers[0]).toEqual({
        username: 'john',
        answer: 'Синий',
        timestamp: expect.any(String)
      });
      expect(result.answers[1]).toEqual({
        username: 'mary',
        answer: 'Красный',
        timestamp: expect.any(String)
      });
    });

    it('should handle different text patterns', () => {
      const ocrResult: OCRResult = {
        text: `username1: answer1
@user2 - answer2
user3 says answer3`,
        confidence: 0.8,
        boundingBoxes: []
      };

      const result = parser.parseAnswersFromText(ocrResult, 'test-story');

      expect(result.answers.length).toBeGreaterThan(0);
      expect(result.total_answers).toBe(result.answers.length);
    });

    it('should use fallback parsing when standard patterns fail', () => {
      const ocrResult: OCRResult = {
        text: `user1
answer1
user2  
answer2`,
        confidence: 0.7,
        boundingBoxes: []
      };

      const result = parser.parseAnswersFromText(ocrResult, 'test-story');

      expect(result.answers.length).toBeGreaterThan(0);
    });

    it('should filter out invalid usernames and answers', () => {
      const ocrResult: OCRResult = {
        text: `@instagram ответил "системное сообщение"
@validuser ответил "реальный ответ"
tap to reply
@123 - слишком короткий username`,
        confidence: 0.8,
        boundingBoxes: []
      };

      const result = parser.parseAnswersFromText(ocrResult, 'test-story');

      // Должен отфильтровать системные сообщения и невалидные данные
      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].username).toBe('validuser');
    });

    it('should deduplicate answers from same user', () => {
      const ocrResult: OCRResult = {
        text: `@john ответил "Первый ответ"
@john ответил "Второй ответ"`,
        confidence: 0.9,
        boundingBoxes: []
      };

      const result = parser.parseAnswersFromText(ocrResult, 'test-story');

      // Должен оставить только один ответ от пользователя
      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].username).toBe('john');
    });

    it('should handle empty or invalid OCR text', () => {
      const ocrResult: OCRResult = {
        text: '',
        confidence: 0.5,
        boundingBoxes: []
      };

      const result = parser.parseAnswersFromText(ocrResult, 'test-story');

      expect(result.answers).toHaveLength(0);
      expect(result.total_answers).toBe(0);
    });
  });

  describe('analyzeExtractionQuality', () => {
    it('should return high quality for good extraction', () => {
      const parsedAnswers = {
        story_id: 'test',
        answers: [
          { username: 'user1', answer: 'answer1', timestamp: '2024-01-01' },
          { username: 'user2', answer: 'answer2', timestamp: '2024-01-01' },
          { username: 'user3', answer: 'answer3', timestamp: '2024-01-01' }
        ],
        total_answers: 3,
        extracted_at: '2024-01-01'
      };

      const quality = parser.analyzeExtractionQuality(parsedAnswers, 0.9);

      expect(quality.quality).toBe('high');
      expect(quality.confidence).toBeGreaterThan(0.8);
      expect(quality.issues).toHaveLength(0);
    });

    it('should return low quality for poor extraction', () => {
      const parsedAnswers = {
        story_id: 'test',
        answers: [],
        total_answers: 0,
        extracted_at: '2024-01-01'
      };

      const quality = parser.analyzeExtractionQuality(parsedAnswers, 0.3);

      expect(quality.quality).toBe('low');
      expect(quality.confidence).toBeLessThan(0.5);
      expect(quality.issues.length).toBeGreaterThan(0);
      expect(quality.issues).toContain('Low OCR confidence');
      expect(quality.issues).toContain('No answers extracted');
    });

    it('should detect duplicate answers issue', () => {
      const parsedAnswers = {
        story_id: 'test',
        answers: [
          { username: 'user1', answer: 'same answer', timestamp: '2024-01-01' },
          { username: 'user2', answer: 'same answer', timestamp: '2024-01-01' },
          { username: 'user3', answer: 'same answer', timestamp: '2024-01-01' },
          { username: 'user4', answer: 'same answer', timestamp: '2024-01-01' }
        ],
        total_answers: 4,
        extracted_at: '2024-01-01'
      };

      const quality = parser.analyzeExtractionQuality(parsedAnswers, 0.8);

      expect(quality.issues).toContain('Many duplicate answers');
    });
  });

  describe('isValidUsername', () => {
    it('should validate correct usernames', () => {
      // Используем приватный метод через any для тестирования
      const parserAny = parser as any;
      
      expect(parserAny.isValidUsername('validuser')).toBe(true);
      expect(parserAny.isValidUsername('user123')).toBe(true);
      expect(parserAny.isValidUsername('test_user')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      const parserAny = parser as any;
      
      expect(parserAny.isValidUsername('')).toBe(false);
      expect(parserAny.isValidUsername('a')).toBe(false); // too short
      expect(parserAny.isValidUsername('instagram')).toBe(false); // blacklisted
      expect(parserAny.isValidUsername('user@domain')).toBe(false); // invalid chars
    });
  });

  describe('isValidAnswer', () => {
    it('should validate correct answers', () => {
      const parserAny = parser as any;
      
      expect(parserAny.isValidAnswer('Синий цвет')).toBe(true);
      expect(parserAny.isValidAnswer('Да')).toBe(true);
      expect(parserAny.isValidAnswer('Нормальный ответ пользователя')).toBe(true);
    });

    it('should reject invalid answers', () => {
      const parserAny = parser as any;
      
      expect(parserAny.isValidAnswer('')).toBe(false); // empty
      expect(parserAny.isValidAnswer('tap to reply')).toBe(false); // system message
      expect(parserAny.isValidAnswer('swipe up')).toBe(false); // system message
      expect(parserAny.isValidAnswer('a'.repeat(501))).toBe(false); // too long
    });
  });
}); 
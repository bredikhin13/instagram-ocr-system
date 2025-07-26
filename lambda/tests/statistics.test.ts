import { StatisticsCalculator } from '../src/modules/statistics';
import { ParsedAnswers } from '../src/types';

describe('StatisticsCalculator', () => {
  let calculator: StatisticsCalculator;

  beforeEach(() => {
    calculator = new StatisticsCalculator();
  });

  describe('calculateStatistics', () => {
    it('should calculate correct statistics for multiple answers', () => {
      const parsedAnswers: ParsedAnswers = {
        story_id: 'test-story',
        answers: [
          { username: 'user1', answer: 'Синий', timestamp: '2024-01-01' },
          { username: 'user2', answer: 'Красный', timestamp: '2024-01-01' },
          { username: 'user3', answer: 'Синий', timestamp: '2024-01-01' },
          { username: 'user4', answer: 'Зеленый', timestamp: '2024-01-01' }
        ],
        total_answers: 4,
        extracted_at: '2024-01-01'
      };

      const result = calculator.calculateStatistics(parsedAnswers);

      expect(result.story_id).toBe('test-story');
      expect(result.total_answers).toBe(4);
      expect(result.unique_answers).toBe(3); // синий, красный, зеленый
      expect(result.answer_distribution).toEqual({
        'синий': 2,
        'красный': 1,
        'зеленый': 1
      });
      expect(result.top_answers).toHaveLength(3);
      expect(result.top_answers[0]).toEqual({
        answer: 'синий',
        count: 2,
        percentage: 50
      });
    });

    it('should handle single answer', () => {
      const parsedAnswers: ParsedAnswers = {
        story_id: 'test-story',
        answers: [
          { username: 'user1', answer: 'Единственный ответ', timestamp: '2024-01-01' }
        ],
        total_answers: 1,
        extracted_at: '2024-01-01'
      };

      const result = calculator.calculateStatistics(parsedAnswers);

      expect(result.total_answers).toBe(1);
      expect(result.unique_answers).toBe(1);
      expect(result.top_answers[0]).toEqual({
        answer: 'единственный ответ',
        count: 1,
        percentage: 100
      });
    });

    it('should handle empty answers', () => {
      const parsedAnswers: ParsedAnswers = {
        story_id: 'test-story',
        answers: [],
        total_answers: 0,
        extracted_at: '2024-01-01'
      };

      const result = calculator.calculateStatistics(parsedAnswers);

      expect(result.total_answers).toBe(0);
      expect(result.unique_answers).toBe(0);
      expect(result.top_answers).toHaveLength(0);
      expect(result.answer_distribution).toEqual({});
    });

    it('should normalize answers for distribution calculation', () => {
      const parsedAnswers: ParsedAnswers = {
        story_id: 'test-story',
        answers: [
          { username: 'user1', answer: 'Синий!', timestamp: '2024-01-01' },
          { username: 'user2', answer: 'синий.', timestamp: '2024-01-01' },
          { username: 'user3', answer: 'СИНИЙ', timestamp: '2024-01-01' }
        ],
        total_answers: 3,
        extracted_at: '2024-01-01'
      };

      const result = calculator.calculateStatistics(parsedAnswers);

      expect(result.unique_answers).toBe(1);
      expect(result.answer_distribution['синий']).toBe(3);
    });
  });

  describe('analyzeTrends', () => {
    it('should analyze answer trends', () => {
      const answers = [
        { username: 'user1', answer: 'Короткий', timestamp: '2024-01-01T10:00:00Z' },
        { username: 'user2', answer: 'Средний ответ', timestamp: '2024-01-01T10:30:00Z' },
        { username: 'user3', answer: 'Очень длинный ответ пользователя', timestamp: '2024-01-01T11:00:00Z' }
      ];

      const result = calculator.analyzeTrends(answers);

      expect(result.answerLengthAverage).toBeGreaterThan(0);
      expect(result.mostPopularTime).toBe('10:00-11:00');
      expect(result.sentimentDistribution).toHaveProperty('positive');
      expect(result.sentimentDistribution).toHaveProperty('negative');
      expect(result.sentimentDistribution).toHaveProperty('neutral');
    });

    it('should handle empty answers in trends', () => {
      const result = calculator.analyzeTrends([]);

      expect(result.answerLengthAverage).toBe(0);
      expect(result.mostPopularTime).toBeNull();
      expect(result.sentimentDistribution).toEqual({});
    });
  });

  describe('calculateDiversityMetrics', () => {
    it('should calculate diversity metrics', () => {
      const answers = [
        { username: 'user1', answer: 'Ответ 1', timestamp: '2024-01-01' },
        { username: 'user2', answer: 'Ответ 2', timestamp: '2024-01-01' },
        { username: 'user3', answer: 'Ответ 1', timestamp: '2024-01-01' }
      ];

      const result = calculator.calculateDiversityMetrics(answers);

      expect(result.uniquenessRatio).toBe(0.67); // 2 unique / 3 total
      expect(result.averageLength).toBeGreaterThan(0);
      expect(result.lengthVariance).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty answers in diversity metrics', () => {
      const result = calculator.calculateDiversityMetrics([]);

      expect(result.uniquenessRatio).toBe(0);
      expect(result.averageLength).toBe(0);
      expect(result.lengthVariance).toBe(0);
    });
  });

  describe('createSummary', () => {
    it('should create summary string', () => {
      const statistics = {
        PK: 'test-story',
        story_id: 'test-story',
        total_answers: 5,
        unique_answers: 3,
        answer_distribution: { 'синий': 3, 'красный': 2 },
        top_answers: [
          { answer: 'синий', count: 3, percentage: 60 },
          { answer: 'красный', count: 2, percentage: 40 }
        ],
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      const summary = calculator.createSummary(statistics);

      expect(summary).toContain('Обработано 5 ответов');
      expect(summary).toContain('Уникальных: 3');
      expect(summary).toContain('синий');
      expect(summary).toContain('60%');
    });

    it('should handle statistics without top answers', () => {
      const statistics = {
        PK: 'test-story',
        story_id: 'test-story',
        total_answers: 0,
        unique_answers: 0,
        answer_distribution: {},
        top_answers: [],
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      const summary = calculator.createSummary(statistics);

      expect(summary).toContain('Обработано 0 ответов');
      expect(summary).toContain('Нет данных о популярных ответах');
    });
  });

  describe('private methods', () => {
    it('should normalize answers correctly', () => {
      const calculatorAny = calculator as any;
      
      expect(calculatorAny.normalizeAnswer('  Тест!  ')).toBe('тест');
      expect(calculatorAny.normalizeAnswer('ВЕРХНИЙ.регистр?')).toBe('верхний регистр');
    });

    it('should analyze sentiment correctly', () => {
      const calculatorAny = calculator as any;
      const answers = [
        { username: 'user1', answer: 'отлично хорошо', timestamp: '2024-01-01' },
        { username: 'user2', answer: 'плохо ужасно', timestamp: '2024-01-01' },
        { username: 'user3', answer: 'нормально', timestamp: '2024-01-01' }
      ];
      
      const result = calculatorAny.analyzeSentiment(answers);
      
      expect(result.positive).toBe(1);
      expect(result.negative).toBe(1);
      expect(result.neutral).toBe(1);
    });
  });
}); 
import { ParsedAnswers, StatisticsRecord, UserAnswer } from '../types';

export class StatisticsCalculator {
  /**
   * Вычисляет агрегированную статистику для story
   */
  calculateStatistics(parsedAnswers: ParsedAnswers): StatisticsRecord {
    try {
      console.log(`Calculating statistics for story ${parsedAnswers.story_id}`);
      
      const answers = parsedAnswers.answers;
      const answerDistribution = this.calculateAnswerDistribution(answers);
      const topAnswers = this.getTopAnswers(answerDistribution, answers.length);
      
      const statistics: StatisticsRecord = {
        PK: parsedAnswers.story_id,
        story_id: parsedAnswers.story_id,
        total_answers: answers.length,
        unique_answers: Object.keys(answerDistribution).length,
        answer_distribution: answerDistribution,
        top_answers: topAnswers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log(`Statistics calculated: ${statistics.total_answers} total, ${statistics.unique_answers} unique`);
      
      return statistics;
    } catch (error) {
      console.error(`Error calculating statistics: ${error}`);
      throw new Error(`Failed to calculate statistics: ${error}`);
    }
  }

  /**
   * Подсчитывает распределение ответов
   */
  private calculateAnswerDistribution(answers: UserAnswer[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const answer of answers) {
      // Нормализуем ответ для подсчета
      const normalizedAnswer = this.normalizeAnswer(answer.answer);
      
      if (distribution[normalizedAnswer]) {
        distribution[normalizedAnswer]++;
      } else {
        distribution[normalizedAnswer] = 1;
      }
    }
    
    return distribution;
  }

  /**
   * Нормализует ответ для статистики
   */
  private normalizeAnswer(answer: string): string {
    return answer
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:]/g, '') // Удаляем пунктуацию
      .replace(/\s+/g, ' '); // Нормализуем пробелы
  }

  /**
   * Получает топ ответов с процентами
   */
  private getTopAnswers(
    distribution: Record<string, number>, 
    totalAnswers: number,
    limit: number = 10
  ): Array<{ answer: string; count: number; percentage: number }> {
    
    const sortedAnswers = Object.entries(distribution)
      .map(([answer, count]) => ({
        answer,
        count,
        percentage: Math.round((count / totalAnswers) * 100 * 100) / 100 // Округляем до 2 знаков
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return sortedAnswers;
  }

  /**
   * Анализирует тренды в ответах
   */
  analyzeTrends(answers: UserAnswer[]): {
    mostPopularTime: string | null;
    answerLengthAverage: number;
    sentimentDistribution: Record<string, number>;
  } {
    try {
      // Анализируем время ответов (если доступно)
      const mostPopularTime = this.findMostPopularTime(answers);
      
      // Средняя длина ответа
      const totalLength = answers.reduce((sum, answer) => sum + answer.answer.length, 0);
      const answerLengthAverage = answers.length > 0 ? Math.round(totalLength / answers.length) : 0;
      
      // Простой анализ настроения
      const sentimentDistribution = this.analyzeSentiment(answers);
      
      return {
        mostPopularTime,
        answerLengthAverage,
        sentimentDistribution
      };
    } catch (error) {
      console.error(`Error analyzing trends: ${error}`);
      return {
        mostPopularTime: null,
        answerLengthAverage: 0,
        sentimentDistribution: {}
      };
    }
  }

  /**
   * Находит самое популярное время для ответов
   */
  private findMostPopularTime(answers: UserAnswer[]): string | null {
    if (answers.length === 0) return null;
    
    const timeSlots: Record<string, number> = {};
    
    for (const answer of answers) {
      if (answer.timestamp) {
        try {
          const date = new Date(answer.timestamp);
          const hour = date.getHours();
          const timeSlot = `${hour}:00-${hour + 1}:00`;
          
          timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1;
        } catch (error) {
          // Игнорируем некорректные timestamps
        }
      }
    }
    
    if (Object.keys(timeSlots).length === 0) return null;
    
    return Object.entries(timeSlots)
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  /**
   * Простой анализ настроения ответов
   */
  private analyzeSentiment(answers: UserAnswer[]): Record<string, number> {
    const positiveWords = ['хорошо', 'отлично', 'супер', 'класс', 'amazing', 'great', 'good', 'love', 'awesome'];
    const negativeWords = ['плохо', 'ужасно', 'terrible', 'bad', 'hate', 'awful', 'horrible'];
    const neutralWords = ['нормально', 'окей', 'ok', 'okay', 'normal', 'fine'];
    
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    
    for (const answer of answers) {
      const lowerAnswer = answer.answer.toLowerCase();
      
      if (positiveWords.some(word => lowerAnswer.includes(word))) {
        positive++;
      } else if (negativeWords.some(word => lowerAnswer.includes(word))) {
        negative++;
      } else {
        neutral++;
      }
    }
    
    return { positive, negative, neutral };
  }

  /**
   * Вычисляет метрики разнообразия ответов
   */
  calculateDiversityMetrics(answers: UserAnswer[]): {
    uniquenessRatio: number;
    averageLength: number;
    lengthVariance: number;
  } {
    if (answers.length === 0) {
      return { uniquenessRatio: 0, averageLength: 0, lengthVariance: 0 };
    }
    
    // Коэффициент уникальности
    const uniqueAnswers = new Set(answers.map(a => this.normalizeAnswer(a.answer)));
    const uniquenessRatio = uniqueAnswers.size / answers.length;
    
    // Средняя длина
    const lengths = answers.map(a => a.answer.length);
    const averageLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    
    // Дисперсия длины
    const lengthVariance = lengths.reduce((sum, len) => sum + Math.pow(len - averageLength, 2), 0) / lengths.length;
    
    return {
      uniquenessRatio: Math.round(uniquenessRatio * 100) / 100,
      averageLength: Math.round(averageLength),
      lengthVariance: Math.round(lengthVariance)
    };
  }

  /**
   * Создает сводку для быстрого обзора
   */
  createSummary(statistics: StatisticsRecord): string {
    const topAnswer = statistics.top_answers[0];
    const summary = [
      `Обработано ${statistics.total_answers} ответов`,
      `Уникальных: ${statistics.unique_answers}`,
      topAnswer ? `Популярный ответ: "${topAnswer.answer}" (${topAnswer.percentage}%)` : 'Нет данных о популярных ответах'
    ].join('. ');
    
    return summary;
  }
} 
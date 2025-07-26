import { UserAnswer, ParsedAnswers, OCRResult } from '../types';

export class AnswerParser {
  /**
   * Парсит OCR текст и извлекает ответы пользователей
   */
  parseAnswersFromText(ocrResult: OCRResult, storyId: string): ParsedAnswers {
    try {
      console.log(`Parsing answers from OCR text for story ${storyId}`);
      
      const text = ocrResult.text;
      const answers = this.extractUsernameAnswerPairs(text);
      
      console.log(`Extracted ${answers.length} answers from OCR text`);
      
      return {
        story_id: storyId,
        answers,
        total_answers: answers.length,
        extracted_at: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error parsing answers: ${error}`);
      throw new Error(`Failed to parse answers: ${error}`);
    }
  }

  /**
   * Извлекает пары username → answer из текста
   */
  private extractUsernameAnswerPairs(text: string): UserAnswer[] {
    const answers: UserAnswer[] = [];
    
    // Различные паттерны для извлечения ответов
    const patterns = [
      // Паттерн: @username ответил "answer"
      /@(\w+)\s+(?:ответил|answered|says?)\s*[":]\s*(.+?)(?=\n|@|$)/gi,
      
      // Паттерн: username: answer
      /^(\w+):\s*(.+?)(?=\n|$)/gm,
      
      // Паттерн: @username - answer
      /@(\w+)\s*[-–]\s*(.+?)(?=\n|@|$)/gi,
      
      // Паттерн для Instagram Stories формата
      /(\w+)\s*\n(.+?)(?=\n\w+|\n@|$)/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const username = match[1].trim();
        const answer = this.cleanAnswer(match[2]);
        
        if (this.isValidUsername(username) && this.isValidAnswer(answer)) {
          // Проверяем, что такой пользователь еще не добавлен
          const existingUser = answers.find(a => a.username.toLowerCase() === username.toLowerCase());
          if (!existingUser) {
            answers.push({
              username,
              answer,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    // Если стандартные паттерны не сработали, пробуем более гибкий подход
    if (answers.length === 0) {
      const fallbackAnswers = this.extractAnswersWithFallback(text);
      answers.push(...fallbackAnswers);
    }

    return this.deduplicateAnswers(answers);
  }

  /**
   * Альтернативный метод извлечения ответов для сложных случаев
   */
  private extractAnswersWithFallback(text: string): UserAnswer[] {
    const answers: UserAnswer[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1]?.trim();
      
      // Ищем строки, которые могут быть username
      const usernameMatch = currentLine.match(/^@?(\w+)$/);
      if (usernameMatch && nextLine && this.isValidAnswer(nextLine)) {
        const username = usernameMatch[1];
        if (this.isValidUsername(username)) {
          answers.push({
            username,
            answer: this.cleanAnswer(nextLine),
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    return answers;
  }

  /**
   * Очищает и нормализует ответ
   */
  private cleanAnswer(answer: string): string {
    return answer
      .replace(/^["\'"«»]/g, '') // Удаляем кавычки в начале
      .replace(/["\'"«»]$/g, '') // Удаляем кавычки в конце
      .replace(/\s+/g, ' ') // Заменяем множественные пробелы одним
      .trim();
  }

  /**
   * Проверяет валидность username
   */
  private isValidUsername(username: string): boolean {
    if (!username || username.length < 2 || username.length > 30) {
      return false;
    }
    
    // Проверяем, что это похоже на username (только буквы, цифры, подчеркивания)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return false;
    }
    
    // Исключаем служебные слова
    const blacklist = [
      'instagram', 'story', 'stories', 'post', 'reply', 'answer',
      'question', 'poll', 'vote', 'tap', 'click', 'swipe'
    ];
    
    return !blacklist.includes(username.toLowerCase());
  }

  /**
   * Проверяет валидность ответа
   */
  private isValidAnswer(answer: string): boolean {
    if (!answer || answer.length < 1 || answer.length > 500) {
      return false;
    }
    
    // Исключаем системные сообщения
    const systemMessages = [
      'tap to reply', 'swipe up', 'see translation', 'view replies',
      'нажмите', 'проведите', 'посмотреть', 'ответить'
    ];
    
    const lowerAnswer = answer.toLowerCase();
    return !systemMessages.some(msg => lowerAnswer.includes(msg));
  }

  /**
   * Удаляет дубликаты ответов
   */
  private deduplicateAnswers(answers: UserAnswer[]): UserAnswer[] {
    const seen = new Set<string>();
    return answers.filter(answer => {
      const key = `${answer.username.toLowerCase()}_${answer.answer.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Анализирует качество извлеченных данных
   */
  analyzeExtractionQuality(parsedAnswers: ParsedAnswers, ocrConfidence: number): {
    quality: 'high' | 'medium' | 'low';
    issues: string[];
    confidence: number;
  } {
    const issues: string[] = [];
    let qualityScore = 1.0;

    // Факторы качества
    if (ocrConfidence < 0.7) {
      issues.push('Low OCR confidence');
      qualityScore *= 0.7;
    }

    if (parsedAnswers.total_answers === 0) {
      issues.push('No answers extracted');
      qualityScore = 0;
    }

    if (parsedAnswers.total_answers < 3) {
      issues.push('Very few answers extracted');
      qualityScore *= 0.8;
    }

    // Проверяем однообразие ответов
    const uniqueAnswers = new Set(parsedAnswers.answers.map(a => a.answer.toLowerCase()));
    if (uniqueAnswers.size < parsedAnswers.total_answers * 0.5) {
      issues.push('Many duplicate answers');
      qualityScore *= 0.9;
    }

    let quality: 'high' | 'medium' | 'low';
    if (qualityScore >= 0.8) quality = 'high';
    else if (qualityScore >= 0.5) quality = 'medium';
    else quality = 'low';

    return {
      quality,
      issues,
      confidence: qualityScore
    };
  }
} 
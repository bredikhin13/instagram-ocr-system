import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  StoryData, 
  AnswerRecord, 
  APIResponse, 
  StoryListResponse,
  StoryStatistics,
  FilterOptions 
} from '../types';

class APIService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = typeof window !== 'undefined' && (window as any).import?.meta?.env?.VITE_API_BASE_URL 
      || process.env.VITE_API_BASE_URL 
      || 'https://your-api-gateway-url.amazonaws.com/prod';
      
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor для обработки ошибок
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error('API Error:', error);
        
        if (error.response?.status === 404) {
          throw new Error('Ресурс не найден');
        } else if (error.response?.status === 500) {
          throw new Error('Ошибка сервера');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Превышено время ожидания');
        }
        
        throw new Error(error.response?.data?.message || 'Произошла ошибка при обращении к API');
      }
    );
  }

  /**
   * Получает список всех stories
   */
  async getStories(filters?: FilterOptions): Promise<StoryListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.minAnswers) params.append('minAnswers', filters.minAnswers.toString());
      if (filters?.searchTerm) params.append('search', filters.searchTerm);

      const response = await this.api.get<APIResponse<StoryListResponse>>(`/stories?${params.toString()}`);
      
      return response.data.data || { stories: [], total: 0, hasMore: false };
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  }

  /**
   * Получает статистику для конкретной story
   */
  async getStoryStatistics(storyId: string): Promise<StoryStatistics> {
    try {
      const response = await this.api.get<APIResponse<StoryStatistics>>(`/stories/${storyId}/statistics`);
      
      if (!response.data.data) {
        throw new Error('Статистика не найдена');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching statistics for story ${storyId}:`, error);
      throw error;
    }
  }

  /**
   * Получает ответы пользователей для конкретной story
   */
  async getStoryAnswers(storyId: string): Promise<AnswerRecord[]> {
    try {
      const response = await this.api.get<APIResponse<AnswerRecord[]>>(`/stories/${storyId}/answers`);
      
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching answers for story ${storyId}:`, error);
      throw error;
    }
  }

  /**
   * Получает данные story (метаданные)
   */
  async getStoryData(storyId: string): Promise<StoryData> {
    try {
      const response = await this.api.get<APIResponse<StoryData>>(`/stories/${storyId}`);
      
      if (!response.data.data) {
        throw new Error('Story не найдена');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching story data for ${storyId}:`, error);
      throw error;
    }
  }

  /**
   * Получает агрегированную статистику по всем stories
   */
  async getOverallStatistics(): Promise<{
    total_stories: number;
    total_answers: number;
    average_answers_per_story: number;
    most_active_period: string;
    top_question_types: Array<{ type: string; count: number }>;
  }> {
    try {
      const response = await this.api.get<APIResponse<any>>('/statistics/overall');
      
      return response.data.data || {
        total_stories: 0,
        total_answers: 0,
        average_answers_per_story: 0,
        most_active_period: '',
        top_question_types: []
      };
    } catch (error) {
      console.error('Error fetching overall statistics:', error);
      throw error;
    }
  }

  /**
   * Экспортирует данные в CSV
   */
  async exportStoryData(storyId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await this.api.get(`/stories/${storyId}/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error exporting story data for ${storyId}:`, error);
      throw error;
    }
  }

  /**
   * Повторная обработка story (если нужно)
   */
  async reprocessStory(storyId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.post<APIResponse<any>>(`/stories/${storyId}/reprocess`);
      
      return {
        success: true,
        message: response.data.message || 'Story успешно отправлена на повторную обработку'
      };
    } catch (error) {
      console.error(`Error reprocessing story ${storyId}:`, error);
      throw error;
    }
  }

  /**
   * Проверяет статус API
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      await this.api.get<APIResponse<any>>('/health');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Создаем единый экземпляр API сервиса
export const apiService = new APIService();

// Экспортируем класс для тестирования
export default APIService; 
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiService } from './api'
import { StoryData, FilterOptions } from '../types'

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        response: {
          use: vi.fn()
        }
      }
    }))
  }
}))

describe('APIService', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn()
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock axios instance
    Object.assign(apiService, { api: mockAxiosInstance })
  })

  describe('getStories', () => {
    it('should fetch stories successfully', async () => {
      const mockStories: StoryData[] = [
        {
          story_id: 'story1',
          user_id: 'user1',
          created_at: '2024-01-01T00:00:00Z',
          question: 'Test question?'
        }
      ]

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          data: {
            stories: mockStories,
            total: 1,
            hasMore: false
          }
        }
      })

      const result = await apiService.getStories()

      expect(result.stories).toEqual(mockStories)
      expect(result.total).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it('should handle filters in getStories', async () => {
      const filters: FilterOptions = {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        minAnswers: 5,
        searchTerm: 'test'
      }

      mockAxiosInstance.get.mockResolvedValue({
        data: { data: { stories: [], total: 0, hasMore: false } }
      })

      await apiService.getStories(filters)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('dateFrom=2024-01-01')
      )
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('minAnswers=5')
      )
    })

    it('should return empty data on error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('API Error'))

      await expect(apiService.getStories()).rejects.toThrow('API Error')
    })
  })

  describe('getStoryStatistics', () => {
    it('should fetch story statistics successfully', async () => {
      const mockStats = {
        story_id: 'story1',
        total_answers: 10,
        unique_answers: 5,
        answer_distribution: { 'answer1': 6, 'answer2': 4 },
        top_answers: [
          { answer: 'answer1', count: 6, percentage: 60 },
          { answer: 'answer2', count: 4, percentage: 40 }
        ],
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }

      mockAxiosInstance.get.mockResolvedValue({
        data: { data: mockStats }
      })

      const result = await apiService.getStoryStatistics('story1')

      expect(result).toEqual(mockStats)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/stories/story1/statistics')
    })

    it('should throw error when statistics not found', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: null }
      })

      await expect(apiService.getStoryStatistics('story1'))
        .rejects.toThrow('Статистика не найдена')
    })
  })

  describe('getStoryAnswers', () => {
    it('should fetch story answers successfully', async () => {
      const mockAnswers = [
        {
          story_id: 'story1',
          username: 'user1',
          answer: 'answer1',
          extracted_at: '2024-01-01',
          created_at: '2024-01-01'
        }
      ]

      mockAxiosInstance.get.mockResolvedValue({
        data: { data: mockAnswers }
      })

      const result = await apiService.getStoryAnswers('story1')

      expect(result).toEqual(mockAnswers)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/stories/story1/answers')
    })

    it('should return empty array on error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Not found'))

      await expect(apiService.getStoryAnswers('story1')).rejects.toThrow()
    })
  })

  describe('getOverallStatistics', () => {
    it('should fetch overall statistics', async () => {
      const mockOverallStats = {
        total_stories: 100,
        total_answers: 500,
        average_answers_per_story: 5.0,
        most_active_period: '2024-01',
        top_question_types: []
      }

      mockAxiosInstance.get.mockResolvedValue({
        data: { data: mockOverallStats }
      })

      const result = await apiService.getOverallStatistics()

      expect(result).toEqual(mockOverallStats)
    })

    it('should return default values on error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Server error'))

      await expect(apiService.getOverallStatistics()).rejects.toThrow()
    })
  })

  describe('exportStoryData', () => {
    it('should export story data as blob', async () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' })

      mockAxiosInstance.get.mockResolvedValue({
        data: mockBlob
      })

      const result = await apiService.exportStoryData('story1', 'csv')

      expect(result).toBeInstanceOf(Blob)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/stories/story1/export',
        expect.objectContaining({
          params: { format: 'csv' },
          responseType: 'blob'
        })
      )
    })
  })

  describe('healthCheck', () => {
    it('should return healthy status on success', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { data: {} } })

      const result = await apiService.healthCheck()

      expect(result.status).toBe('healthy')
      expect(result.timestamp).toBeDefined()
    })

    it('should return unhealthy status on error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Server down'))

      const result = await apiService.healthCheck()

      expect(result.status).toBe('unhealthy')
      expect(result.timestamp).toBeDefined()
    })
  })
}) 
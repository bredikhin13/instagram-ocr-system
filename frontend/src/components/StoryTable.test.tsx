import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import StoryTable from './StoryTable'
import { apiService } from '../services/api'

// Mock API service
vi.mock('../services/api', () => ({
  apiService: {
    getStories: vi.fn()
  }
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('StoryTable', () => {
  const mockStories = [
    {
      story_id: 'story1',
      user_id: 'user1',
      created_at: '2024-01-01T12:00:00Z',
      question: 'Какой ваш любимый цвет?'
    },
    {
      story_id: 'story2',
      user_id: 'user2',
      created_at: '2024-01-02T14:00:00Z',
      question: 'Что вы думаете о нашем продукте?'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render stories table with data', async () => {
    const mockedApiService = vi.mocked(apiService)
    mockedApiService.getStories.mockResolvedValue({
      stories: mockStories,
      total: 2,
      hasMore: false
    })

    renderWithRouter(<StoryTable />)

    await waitFor(() => {
      expect(screen.getByText('Instagram Stories')).toBeInTheDocument()
      expect(screen.getByText('story1')).toBeInTheDocument()
      expect(screen.getByText('story2')).toBeInTheDocument()
      expect(screen.getByText('Какой ваш любимый цвет?')).toBeInTheDocument()
    })
  })

  it('should display loading state initially', () => {
    const mockedApiService = vi.mocked(apiService)
    mockedApiService.getStories.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderWithRouter(<StoryTable />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should display error state on API failure', async () => {
    const mockedApiService = vi.mocked(apiService)
    mockedApiService.getStories.mockRejectedValue(new Error('API Error'))

    renderWithRouter(<StoryTable />)

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
      expect(screen.getByText('Попробовать снова')).toBeInTheDocument()
    })
  })

  it('should handle search functionality', async () => {
    const mockedApiService = vi.mocked(apiService)
    mockedApiService.getStories.mockResolvedValue({
      stories: mockStories,
      total: 2,
      hasMore: false
    })

    renderWithRouter(<StoryTable />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Поиск по ID или вопросу...')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Поиск по ID или вопросу...')
    const searchButton = screen.getByText('Поиск')

    fireEvent.change(searchInput, { target: { value: 'story1' } })
    fireEvent.click(searchButton)

    expect(mockedApiService.getStories).toHaveBeenCalledWith(
      expect.objectContaining({ searchTerm: 'story1' })
    )
  })

  it('should navigate to story details on button click', async () => {
    const mockedApiService = vi.mocked(apiService)
    mockedApiService.getStories.mockResolvedValue({
      stories: mockStories,
      total: 2,
      hasMore: false
    })

    renderWithRouter(<StoryTable />)

    await waitFor(() => {
      expect(screen.getAllByText('Подробнее')).toHaveLength(2)
    })

    const detailButtons = screen.getAllByText('Подробнее')
    fireEvent.click(detailButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/stories/story1')
  })

  it('should handle sorting functionality', async () => {
    const mockedApiService = vi.mocked(apiService)
    mockedApiService.getStories.mockResolvedValue({
      stories: mockStories,
      total: 2,
      hasMore: false
    })

    renderWithRouter(<StoryTable />)

    await waitFor(() => {
      expect(screen.getByText('Story ID')).toBeInTheDocument()
    })

    const storyIdHeader = screen.getByText('Story ID')
    fireEvent.click(storyIdHeader)

    // Should show sort indicator
    expect(storyIdHeader.parentElement).toHaveTextContent('↑')
  })

  it('should show empty state when no stories', async () => {
    const mockedApiService = vi.mocked(apiService)
    mockedApiService.getStories.mockResolvedValue({
      stories: [],
      total: 0,
      hasMore: false
    })

    renderWithRouter(<StoryTable />)

    await waitFor(() => {
      expect(screen.getByText('Нет данных')).toBeInTheDocument()
      expect(screen.getByText('Stories не найдены. Попробуйте изменить критерии поиска.')).toBeInTheDocument()
    })
  })

  it('should display correct stories count', async () => {
    const mockedApiService = vi.mocked(apiService)
    mockedApiService.getStories.mockResolvedValue({
      stories: mockStories,
      total: 2,
      hasMore: false
    })

    renderWithRouter(<StoryTable />)

    await waitFor(() => {
      expect(screen.getByText('Найдено: 2 stories')).toBeInTheDocument()
    })
  })

  it('should handle retry on error', async () => {
    const mockedApiService = vi.mocked(apiService)
    mockedApiService.getStories
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({
        stories: mockStories,
        total: 2,
        hasMore: false
      })

    renderWithRouter(<StoryTable />)

    await waitFor(() => {
      expect(screen.getByText('Попробовать снова')).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Попробовать снова')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('story1')).toBeInTheDocument()
    })

    expect(mockedApiService.getStories).toHaveBeenCalledTimes(2)
  })
}) 
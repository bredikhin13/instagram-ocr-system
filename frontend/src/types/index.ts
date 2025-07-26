export interface StoryData {
  story_id: string;
  user_id: string;
  created_at: string;
  question: string;
  media_url?: string;
  metadata?: Record<string, any>;
}

export interface UserAnswer {
  username: string;
  answer: string;
  timestamp?: string;
}

export interface AnswerRecord {
  story_id: string;
  username: string;
  answer: string;
  extracted_at: string;
  created_at: string;
}

export interface StatisticsRecord {
  story_id: string;
  total_answers: number;
  unique_answers: number;
  answer_distribution: Record<string, number>;
  top_answers: Array<{
    answer: string;
    count: number;
    percentage: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface StoryListResponse {
  stories: StoryData[];
  total: number;
  hasMore: boolean;
  lastKey?: string;
}

export interface StoryStatistics extends StatisticsRecord {
  story_data?: StoryData;
  answers?: AnswerRecord[];
}

export interface ChartData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  minAnswers?: number;
  searchTerm?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface TableColumn {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
} 
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, MessageSquare, PieChart as PieChartIcon } from 'lucide-react';
import { apiService } from '../services/api';
import { StoryStatistics, ChartData, LoadingState } from '../types';

const StatisticsView = () => {
  const [overallStats, setOverallStats] = useState<any>(null);
  const [topStories, setTopStories] = useState<StoryStatistics[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: true });
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [storyStats, setStoryStats] = useState<StoryStatistics | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading({ isLoading: true });
      
      // Загружаем общую статистику
      const overall = await apiService.getOverallStatistics();
      setOverallStats(overall);
      
      // Загружаем топ stories (пока заглушка)
      const stories = await apiService.getStories({ minAnswers: 1 });
      const storiesWithStats = await Promise.all(
        stories.stories.slice(0, 5).map(async (story) => {
          try {
            const stats = await apiService.getStoryStatistics(story.story_id);
            return { ...stats, story_data: story };
          } catch {
            return null;
          }
        })
      );
      
      setTopStories(storiesWithStats.filter(Boolean) as StoryStatistics[]);
      setLoading({ isLoading: false });
    } catch (error) {
      setLoading({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Ошибка загрузки статистики'
      });
    }
  };

  const loadStoryStatistics = async (storyId: string) => {
    try {
      const stats = await apiService.getStoryStatistics(storyId);
      setStoryStats(stats);
      setSelectedStory(storyId);
    } catch (error) {
      console.error('Error loading story statistics:', error);
    }
  };

  const prepareChartData = (statistics: StoryStatistics): ChartData[] => {
    return statistics.top_answers.map((answer, index) => ({
      name: answer.answer.length > 20 ? answer.answer.substring(0, 20) + '...' : answer.answer,
      value: answer.count,
      percentage: answer.percentage,
      color: getColor(index)
    }));
  };

  const getColor = (index: number): string => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    return colors[index % colors.length];
  };

  if (loading.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Ошибка загрузки</h3>
            <p className="mt-1 text-sm text-red-700">{loading.error}</p>
            <button 
              onClick={loadStatistics}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Статистика и аналитика</h2>

      {/* Overall Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Всего Stories</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {overallStats?.total_stories || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Всего ответов</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {overallStats?.total_answers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Среднее на Story</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {overallStats?.average_answers_per_story?.toFixed(1) || '0.0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PieChartIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Активный период</h3>
              <p className="text-sm font-semibold text-gray-900">
                {overallStats?.most_active_period || 'Нет данных'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Stories */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Топ Stories по активности</h3>
        <div className="space-y-4">
          {topStories.map((story) => (
            <div
              key={story.story_id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedStory === story.story_id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => loadStoryStatistics(story.story_id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{story.story_id}</h4>
                  {story.story_data?.question && (
                    <p className="text-sm text-gray-600 mt-1">{story.story_data.question}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{story.total_answers}</span>
                  <p className="text-xs text-gray-500">ответов</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Story Statistics */}
      {storyStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Распределение ответов для Story {selectedStory}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareChartData(storyStats)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, _name) => [value, 'Количество']}
                  labelFormatter={(label) => `Ответ: ${label}`}
                />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Процентное соотношение
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepareChartData(storyStats)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {prepareChartData(storyStats).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {storyStats && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Подробная статистика</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Основные метрики</h4>
              <ul className="space-y-1 text-sm text-gray-900">
                <li>Всего ответов: <span className="font-medium">{storyStats.total_answers}</span></li>
                <li>Уникальных ответов: <span className="font-medium">{storyStats.unique_answers}</span></li>
                <li>Разнообразие: <span className="font-medium">
                  {((storyStats.unique_answers / storyStats.total_answers) * 100).toFixed(1)}%
                </span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Топ-3 ответа</h4>
              <ul className="space-y-1 text-sm text-gray-900">
                {storyStats.top_answers.slice(0, 3).map((answer, index) => (
                  <li key={index}>
                    {index + 1}. {answer.answer} ({answer.count})
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Временные метки</h4>
              <ul className="space-y-1 text-sm text-gray-900">
                <li>Создано: {new Date(storyStats.created_at).toLocaleDateString()}</li>
                <li>Обновлено: {new Date(storyStats.updated_at).toLocaleDateString()}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsView; 
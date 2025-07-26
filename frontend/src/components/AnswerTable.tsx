import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, User, MessageCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { apiService } from '../services/api';
import { AnswerRecord, StoryData, LoadingState } from '../types';

const AnswerTable = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: true });
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set());
  const [colorMap, setColorMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (storyId) {
      loadData();
    }
  }, [storyId]);

  const loadData = async () => {
    if (!storyId) return;

    try {
      setLoading({ isLoading: true });
      
      const [answersData, storyInfo] = await Promise.all([
        apiService.getStoryAnswers(storyId),
        apiService.getStoryData(storyId).catch(() => null) // Игнорируем ошибку если story.json отсутствует
      ]);
      
      setAnswers(answersData);
      setStoryData(storyInfo);
      
      // Генерируем цветовую карту для ответов
      generateColorMap(answersData);
      
      setLoading({ isLoading: false });
    } catch (error) {
      setLoading({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Ошибка загрузки данных'
      });
    }
  };

  const generateColorMap = (answers: AnswerRecord[]) => {
    const uniqueAnswers = [...new Set(answers.map(a => a.answer.toLowerCase().trim()))];
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800', 
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800',
      'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800'
    ];
    
    const newColorMap = new Map<string, string>();
    uniqueAnswers.forEach((answer, index) => {
      newColorMap.set(answer, colors[index % colors.length]);
    });
    
    setColorMap(newColorMap);
  };

  const getAnswerColor = (answer: string) => {
    const normalizedAnswer = answer.toLowerCase().trim();
    return colorMap.get(normalizedAnswer) || 'bg-gray-100 text-gray-800';
  };

  const handleExport = async () => {
    if (!storyId) return;
    
    try {
      const blob = await apiService.exportStoryData(storyId, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `story_${storyId}_answers.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: ru });
    } catch {
      return dateString;
    }
  };

  const toggleAnswerSelection = (username: string) => {
    const newSelected = new Set(selectedAnswers);
    if (newSelected.has(username)) {
      newSelected.delete(username);
    } else {
      newSelected.add(username);
    }
    setSelectedAnswers(newSelected);
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
      <div className="space-y-4">
        <button
          onClick={() => navigate('/stories')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к списку
        </button>
        
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
                onClick={loadData}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/stories')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            Ответы для Story {storyId}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {answers.length} ответов
          </span>
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Story Info */}
      {storyData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Информация о Story</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Вопрос:</label>
              <p className="text-sm text-gray-900">{storyData.question || 'Не указан'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Создано:</label>
              <p className="text-sm text-gray-900">{formatDate(storyData.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">User ID:</label>
              <p className="text-sm text-gray-900">{storyData.user_id}</p>
            </div>
            {storyData.media_url && (
              <div>
                <label className="text-sm font-medium text-gray-500">Media URL:</label>
                <p className="text-sm text-gray-900 truncate">{storyData.media_url}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Color Legend */}
      {colorMap.size > 1 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Цветовая подсветка ответов:</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(colorMap.entries()).map(([answer, colorClass]) => (
              <span
                key={answer}
                className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
              >
                {answer}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Answers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedAnswers.size === answers.length && answers.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAnswers(new Set(answers.map(a => a.username)));
                    } else {
                      setSelectedAnswers(new Set());
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ответ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Извлечено
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {answers.map((answer) => (
              <tr 
                key={`${answer.story_id}-${answer.username}`}
                className={`hover:bg-gray-50 ${selectedAnswers.has(answer.username) ? 'bg-blue-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedAnswers.has(answer.username)}
                    onChange={() => toggleAnswerSelection(answer.username)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {answer.username}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getAnswerColor(answer.answer)}`}>
                    {answer.answer}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(answer.extracted_at)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {answers.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет ответов</h3>
            <p className="mt-1 text-sm text-gray-500">
              Для этой story пока не найдено ответов пользователей.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnswerTable; 
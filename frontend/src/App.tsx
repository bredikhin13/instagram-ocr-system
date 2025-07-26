import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { BarChart3, FileText, Settings, Home } from 'lucide-react';
import StoryTable from './components/StoryTable';
import StatisticsView from './components/StatisticsView';
import AnswerTable from './components/AnswerTable';
import { apiService } from './services/api';
import './styles/index.css';

function App() {
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    // Проверяем статус API при загрузке
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const health = await apiService.healthCheck();
      setIsApiHealthy(health.status === 'healthy');
    } catch (error) {
      setIsApiHealthy(false);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Instagram OCR Analytics
                </h1>
                {isApiHealthy === false && (
                  <span className="ml-4 px-2 py-1 bg-red-100 text-red-700 text-sm rounded">
                    API недоступен
                  </span>
                )}
                {isApiHealthy === true && (
                  <span className="ml-4 px-2 py-1 bg-green-100 text-green-700 text-sm rounded">
                    API работает
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <nav className="w-64 bg-white shadow-sm h-screen sticky top-0">
            <div className="p-4">
              <ul className="space-y-2">
                <li>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <Home className="mr-3 h-4 w-4" />
                    Главная
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/stories"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <FileText className="mr-3 h-4 w-4" />
                    Stories
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/statistics"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <BarChart3 className="mr-3 h-4 w-4" />
                    Статистика
                  </NavLink>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stories" element={<StoryTable />} />
              <Route path="/stories/:storyId" element={<AnswerTable />} />
              <Route path="/statistics" element={<StatisticsView />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

// Компонент Dashboard для главной страницы
function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverallStats = async () => {
      try {
        const overallStats = await apiService.getOverallStatistics();
        setStats(overallStats);
      } catch (error) {
        console.error('Error loading overall statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOverallStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Обзор системы</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Всего Stories</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.total_stories || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Всего ответов</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.total_answers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Settings className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Среднее на Story</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.average_answers_per_story?.toFixed(1) || '0.0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Home className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Активный период</h3>
              <p className="text-sm font-semibold text-gray-900">
                {stats?.most_active_period || 'Нет данных'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Добро пожаловать в систему анализа Instagram Stories
        </h3>
        <p className="text-gray-600 mb-4">
          Эта система автоматически обрабатывает изображения из Instagram Stories с помощью OCR,
          извлекает ответы пользователей и предоставляет детальную статистику.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Возможности:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Автоматическое распознавание текста</li>
              <li>• Извлечение пар username → answer</li>
              <li>• Статистический анализ ответов</li>
              <li>• Визуализация данных</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Как использовать:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Загрузите изображения в S3</li>
              <li>• Система автоматически обработает их</li>
              <li>• Просматривайте результаты в разделах</li>
              <li>• Анализируйте статистику</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 
// Простые тесты для frontend логики без внешних зависимостей

// Mock данные для тестирования
const mockStoryData = [
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
];

const mockAnswerData = [
  {
    story_id: 'story1',
    username: 'user1',
    answer: 'Синий',
    extracted_at: '2024-01-01T12:30:00Z',
    created_at: '2024-01-01T12:30:00Z'
  },
  {
    story_id: 'story1',
    username: 'user2',
    answer: 'Красный',
    extracted_at: '2024-01-01T12:35:00Z',
    created_at: '2024-01-01T12:35:00Z'
  },
  {
    story_id: 'story1',
    username: 'user3',
    answer: 'Синий',
    extracted_at: '2024-01-01T12:40:00Z',
    created_at: '2024-01-01T12:40:00Z'
  }
];

// Функция для фильтрации stories по поисковому запросу
function filterStories(stories, searchTerm) {
  if (!searchTerm) return stories;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return stories.filter(story => 
    story.story_id.toLowerCase().includes(lowerSearchTerm) ||
    (story.question && story.question.toLowerCase().includes(lowerSearchTerm))
  );
}

// Функция для сортировки stories
function sortStories(stories, sortKey, direction = 'asc') {
  return [...stories].sort((a, b) => {
    let aValue = a[sortKey];
    let bValue = b[sortKey];
    
    // Обработка дат
    if (sortKey === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
}

// Функция для генерации цветовой карты ответов
function generateColorMap(answers) {
  const uniqueAnswers = [...new Set(answers.map(a => a.answer.toLowerCase().trim()))];
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800', 
    'bg-yellow-100 text-yellow-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800'
  ];
  
  const colorMap = new Map();
  uniqueAnswers.forEach((answer, index) => {
    colorMap.set(answer, colors[index % colors.length]);
  });
  
  return colorMap;
}

// Функция для подготовки данных для графиков
function prepareChartData(answers) {
  const distribution = {};
  
  answers.forEach(answer => {
    const normalizedAnswer = answer.answer.toLowerCase().trim();
    distribution[normalizedAnswer] = (distribution[normalizedAnswer] || 0) + 1;
  });
  
  return Object.entries(distribution).map(([answer, count], index) => ({
    name: answer.length > 20 ? answer.substring(0, 20) + '...' : answer,
    value: count,
    percentage: Math.round((count / answers.length) * 100),
    color: `hsl(${index * 60}, 70%, 50%)`
  }));
}

// Функция для форматирования даты
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

// Валидация API ответа
function validateApiResponse(response, expectedStructure) {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  for (const key of expectedStructure) {
    if (!(key in response)) {
      return false;
    }
  }
  
  return true;
}

// Функция для создания URL с параметрами
function buildUrlWithParams(baseUrl, params) {
  const url = new URL(baseUrl, 'http://localhost'); // Используем localhost как base для тестов
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });
  
  return url.pathname + url.search;
}

// Функция для запуска тестов
function runFrontendTests() {
  console.log('🎨 Запуск frontend тестов...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name, testFunction) {
    try {
      testFunction();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }
  
  function assertEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }
  
  function assertTrue(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed: expected true');
    }
  }
  
  // Тест 1: Фильтрация stories
  test('Фильтрация stories по поисковому запросу', () => {
    const result1 = filterStories(mockStoryData, 'story1');
    const result2 = filterStories(mockStoryData, 'цвет');
    
    assertEqual(result1.length, 1, 'Должна найтись 1 story по ID');
    assertEqual(result1[0].story_id, 'story1', 'Должна найтись правильная story');
    assertEqual(result2.length, 1, 'Должна найтись 1 story по вопросу');
  });
  
  // Тест 2: Сортировка stories
  test('Сортировка stories', () => {
    const sortedAsc = sortStories(mockStoryData, 'story_id', 'asc');
    const sortedDesc = sortStories(mockStoryData, 'story_id', 'desc');
    
    assertEqual(sortedAsc[0].story_id, 'story1', 'Первый элемент при сортировке по возрастанию');
    assertEqual(sortedDesc[0].story_id, 'story2', 'Первый элемент при сортировке по убыванию');
  });
  
  // Тест 3: Генерация цветовой карты
  test('Генерация цветовой карты для ответов', () => {
    const colorMap = generateColorMap(mockAnswerData);
    
    assertTrue(colorMap.has('синий'), 'Должен быть цвет для ответа "синий"');
    assertTrue(colorMap.has('красный'), 'Должен быть цвет для ответа "красный"');
    assertEqual(colorMap.size, 2, 'Должно быть 2 уникальных цвета');
  });
  
  // Тест 4: Подготовка данных для графиков
  test('Подготовка данных для графиков', () => {
    const chartData = prepareChartData(mockAnswerData);
    
    assertEqual(chartData.length, 2, 'Должно быть 2 элемента в данных графика');
    assertEqual(chartData[0].value, 2, 'Синий должен встречаться 2 раза');
    assertEqual(chartData[1].value, 1, 'Красный должен встречаться 1 раз');
    assertEqual(chartData[0].percentage, 67, 'Синий должен составлять 67%');
  });
  
  // Тест 5: Форматирование даты
  test('Форматирование даты', () => {
    const formatted = formatDate('2024-01-01T12:00:00Z');
    
    assertTrue(formatted.includes('2024'), 'Должен содержать год');
    assertTrue(formatted.includes('1') || formatted.includes('01'), 'Должен содержать день');
  });
  
  // Тест 6: Валидация API ответа
  test('Валидация структуры API ответа', () => {
    const validResponse = { stories: [], total: 0, hasMore: false };
    const invalidResponse = { stories: [] }; // отсутствует total
    
    assertTrue(
      validateApiResponse(validResponse, ['stories', 'total', 'hasMore']),
      'Валидный ответ должен пройти проверку'
    );
    assertTrue(
      !validateApiResponse(invalidResponse, ['stories', 'total', 'hasMore']),
      'Невалидный ответ не должен пройти проверку'
    );
  });
  
  // Тест 7: Построение URL с параметрами
  test('Построение URL с параметрами', () => {
    const url = buildUrlWithParams('/api/stories', {
      dateFrom: '2024-01-01',
      minAnswers: 5,
      search: 'test'
    });
    
    assertTrue(url.includes('dateFrom=2024-01-01'), 'URL должен содержать dateFrom');
    assertTrue(url.includes('minAnswers=5'), 'URL должен содержать minAnswers');
    assertTrue(url.includes('search=test'), 'URL должен содержать search');
  });
  
  // Тест 8: Обработка пустых данных
  test('Обработка пустых данных', () => {
    const emptyFilter = filterStories([], 'test');
    const emptyChart = prepareChartData([]);
    const emptyColorMap = generateColorMap([]);
    
    assertEqual(emptyFilter.length, 0, 'Пустой массив должен остаться пустым');
    assertEqual(emptyChart.length, 0, 'Пустые данные графика');
    assertEqual(emptyColorMap.size, 0, 'Пустая цветовая карта');
  });
  
  console.log(`\n📊 Результаты frontend тестов:`);
  console.log(`✅ Прошло: ${passed}`);
  console.log(`❌ Провалено: ${failed}`);
  console.log(`📈 Успешность: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 Все frontend тесты прошли успешно!');
    return true;
  } else {
    console.log('\n⚠️  Некоторые frontend тесты провалились');
    return false;
  }
}

// Запускаем тесты
const success = runFrontendTests();
if (typeof process !== 'undefined' && typeof process.exit === 'function') {
  process.exit(success ? 0 : 1);
}

// Экспорт для использования в других тестах
if (typeof module !== 'undefined') {
  module.exports = {
    filterStories,
    sortStories,
    generateColorMap,
    prepareChartData,
    formatDate,
    validateApiResponse,
    buildUrlWithParams,
    runFrontendTests
  };
} 
// Простые тесты для проверки основного функционала без внешних зависимостей

// Тест функции парсинга username из текста
function extractUsernameFromText(text) {
  const patterns = [
    /@(\w+)\s+(?:ответил|answered|says?)\s*[":]\s*(.+?)(?=\n|@|$)/gi,
    /(\w+):\s*(.+?)(?=\n|$)/gm,
    /@(\w+)\s*[-–]\s*(.+?)(?=\n|@|$)/gi
  ];
  
  const results = [];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const username = match[1].trim();
      const answer = match[2]?.trim();
      
      if (username && answer && username.length > 1 && username.length < 30) {
        // Очищаем ответ от кавычек
        const cleanAnswer = answer.replace(/^["\'"«»]/g, '').replace(/["\'"«»]$/g, '');
        results.push({ username, answer: cleanAnswer });
      }
    }
  }
  
  return results;
}

// Тест функции нормализации ответа
function normalizeAnswer(answer) {
  return answer
    .replace(/^["\'"«»]/g, '') // удаляем кавычки в начале
    .replace(/["\'"«»]$/g, '') // удаляем кавычки в конце
    .replace(/[.,!?;:]/g, '') // удаляем пунктуацию
    .replace(/\s+/g, ' ') // нормализуем пробелы
    .trim()
    .toLowerCase();
}

// Тест функции вычисления статистики
function calculateAnswerDistribution(answers) {
  const distribution = {};
  
  for (const answer of answers) {
    const normalized = normalizeAnswer(answer.answer);
    distribution[normalized] = (distribution[normalized] || 0) + 1;
  }
  
  return distribution;
}

// Функция для запуска тестов
function runTests() {
  console.log('🧪 Запуск простых тестов...\n');
  
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
  
  // Тест 1: Парсинг username из простого текста
  test('Парсинг username из простого текста', () => {
    const text = '@john ответил "Синий"\n@mary: Красный';
    const result = extractUsernameFromText(text);
    
    assertEqual(result.length, 2, 'Должно быть найдено 2 ответа');
    assertEqual(result[0].username, 'john', 'Первый username должен быть john');
    assertEqual(result[0].answer, 'Синий', 'Первый ответ должен быть Синий');
  });
  
  // Тест 2: Нормализация ответов
  test('Нормализация ответов', () => {
    const answer1 = normalizeAnswer('"Тест!"');
    const answer2 = normalizeAnswer('  ТЕСТ  ');
    
    assertEqual(answer1, 'тест', 'Должны удаляться кавычки и знаки');
    assertEqual(answer2, 'тест', 'Должны убираться пробелы и приводиться к нижнему регистру');
  });
  
  // Тест 3: Подсчет распределения ответов
  test('Подсчет распределения ответов', () => {
    const answers = [
      { username: 'user1', answer: 'Синий' },
      { username: 'user2', answer: 'синий!' },
      { username: 'user3', answer: 'Красный' }
    ];
    
    const distribution = calculateAnswerDistribution(answers);
    
    assertEqual(distribution['синий'], 2, 'Должно быть 2 синих ответа');
    assertEqual(distribution['красный'], 1, 'Должен быть 1 красный ответ');
  });
  
  // Тест 4: Обработка пустых данных
  test('Обработка пустых данных', () => {
    const emptyText = extractUsernameFromText('');
    const emptyDistribution = calculateAnswerDistribution([]);
    
    assertEqual(emptyText.length, 0, 'Пустой текст должен давать пустой результат');
    assertEqual(Object.keys(emptyDistribution).length, 0, 'Пустой массив должен давать пустое распределение');
  });
  
  // Тест 5: Фильтрация невалидных username
  test('Фильтрация невалидных username', () => {
    const text = '@a ответил "слишком короткий"\n@validuser ответил "нормальный ответ"';
    const result = extractUsernameFromText(text);
    
    assertEqual(result.length, 1, 'Должен быть отфильтрован короткий username');
    assertEqual(result[0].username, 'validuser', 'Должен остаться только валидный username');
  });
  
  console.log(`\n📊 Результаты тестов:`);
  console.log(`✅ Прошло: ${passed}`);
  console.log(`❌ Провалено: ${failed}`);
  console.log(`📈 Успешность: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 Все тесты прошли успешно!');
    return true;
  } else {
    console.log('\n⚠️  Некоторые тесты провалились');
    return false;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = {
  extractUsernameFromText,
  normalizeAnswer,
  calculateAnswerDistribution,
  runTests
}; 
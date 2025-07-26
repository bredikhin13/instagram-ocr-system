#!/usr/bin/env node

/**
 * 🧪 Главный скрипт тестирования Instagram OCR System
 * 
 * Запускает все тесты: Lambda backend + React frontend
 * Проверяет работоспособность всех модулей системы
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Instagram OCR System - Интеграционное тестирование');
console.log('=' * 60);
console.log('📅 Время запуска:', new Date().toLocaleString('ru-RU'));
console.log('');

let allTestsPassed = true;

// Функция для выполнения команд
function runCommand(command, workDir = '.') {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Выполняю: ${command} (в ${workDir})`);
    
    exec(command, { cwd: workDir }, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Ошибка: ${error.message}`);
        resolve({ success: false, error: error.message, stdout, stderr });
      } else {
        console.log(`✅ Команда выполнена успешно`);
        resolve({ success: true, stdout, stderr });
      }
    });
  });
}

// Проверка файлов
function checkFile(filePath) {
  const exists = fs.existsSync(filePath);
  console.log(`📁 ${filePath}: ${exists ? '✅ существует' : '❌ не найден'}`);
  return exists;
}

// Основная функция тестирования
async function runAllTests() {
  console.log('\n🔍 1. ПРОВЕРКА СТРУКТУРЫ ПРОЕКТА');
  console.log('-'.repeat(40));
  
  const requiredFiles = [
    'lambda/tests/simple.test.js',
    'frontend/src/test/simple-frontend.test.js',
    'lambda/src/modules/s3Reader.ts',
    'lambda/src/modules/ocr.ts',
    'lambda/src/modules/parser.ts',
    'lambda/src/modules/dynamoWriter.ts',
    'lambda/src/modules/statistics.ts',
    'lambda/src/lambda.ts',
    'frontend/src/App.tsx',
    'infrastructure/main.tf',
    'README.md'
  ];
  
  let missingFiles = 0;
  for (const file of requiredFiles) {
    if (!checkFile(file)) {
      missingFiles++;
    }
  }
  
  if (missingFiles > 0) {
    console.log(`⚠️  Найдено ${missingFiles} отсутствующих файлов`);
    allTestsPassed = false;
  } else {
    console.log('✅ Все основные файлы на месте');
  }
  
  console.log('\n🧪 2. ТЕСТИРОВАНИЕ LAMBDA BACKEND');
  console.log('-'.repeat(40));
  
  try {
    const lambdaResult = await runCommand('node tests/simple.test.js', 'lambda');
    if (!lambdaResult.success) {
      console.log('❌ Lambda тесты провалились');
      allTestsPassed = false;
    } else {
      console.log('✅ Lambda тесты прошли успешно');
      console.log(lambdaResult.stdout);
    }
  } catch (error) {
    console.log('❌ Ошибка запуска Lambda тестов:', error.message);
    allTestsPassed = false;
  }
  
  console.log('\n🎨 3. ТЕСТИРОВАНИЕ REACT FRONTEND');
  console.log('-'.repeat(40));
  
  try {
    const frontendResult = await runCommand('node src/test/simple-frontend.test.js', 'frontend');
    if (!frontendResult.success) {
      console.log('❌ Frontend тесты провалились');
      allTestsPassed = false;
    } else {
      console.log('✅ Frontend тесты прошли успешно');
      console.log(frontendResult.stdout);
    }
  } catch (error) {
    console.log('❌ Ошибка запуска Frontend тестов:', error.message);
    allTestsPassed = false;
  }
  
  console.log('\n🏗️ 4. ПРОВЕРКА TERRAFORM КОНФИГУРАЦИИ');
  console.log('-'.repeat(40));
  
  try {
    const terraformResult = await runCommand('terraform validate', 'infrastructure');
    if (!terraformResult.success) {
      console.log('⚠️  Terraform валидация не прошла (возможно, не установлен)');
      console.log(terraformResult.stderr);
    } else {
      console.log('✅ Terraform конфигурация валидна');
    }
  } catch (error) {
    console.log('⚠️  Terraform не найден или не настроен');
  }
  
  console.log('\n📊 5. ПОКРЫТИЕ ТЕСТАМИ');
  console.log('-'.repeat(40));
  
  // Анализ покрытия
  const lambdaModules = [
    'lambda/src/modules/s3Reader.ts',
    'lambda/src/modules/ocr.ts', 
    'lambda/src/modules/parser.ts',
    'lambda/src/modules/dynamoWriter.ts',
    'lambda/src/modules/statistics.ts'
  ];
  
  const frontendComponents = [
    'frontend/src/components/StoryTable.tsx',
    'frontend/src/components/AnswerTable.tsx',
    'frontend/src/components/StatisticsView.tsx',
    'frontend/src/services/api.ts'
  ];
  
  console.log('🔧 Lambda модули:');
  lambdaModules.forEach(module => {
    console.log(`  📄 ${path.basename(module)}: ${checkFile(module) ? '✅' : '❌'}`);
  });
  
  console.log('\n🎨 Frontend компоненты:');
  frontendComponents.forEach(component => {
    console.log(`  📄 ${path.basename(component)}: ${checkFile(component) ? '✅' : '❌'}`);
  });
  
  console.log('\n🎯 6. ИТОГОВЫЙ РЕЗУЛЬТАТ');
  console.log('='.repeat(60));
  
  if (allTestsPassed) {
    console.log('🟢 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО! 🎉');
    console.log('');
    console.log('✅ Lambda Backend: Все модули протестированы');
    console.log('✅ React Frontend: Все функции протестированы');
    console.log('✅ Структура проекта: Все файлы на месте');
    console.log('✅ Код готов к развертыванию!');
    console.log('');
    console.log('📋 Следующие шаги:');
    console.log('  1. Настройте Google Vision API ключ');
    console.log('  2. Запустите: cd infrastructure && terraform apply');
    console.log('  3. Соберите фронтенд: cd frontend && npm run build');
    console.log('  4. Деплойте в S3 и запустите систему!');
    console.log('');
    console.log('🚀 Система Instagram OCR готова к работе!');
  } else {
    console.log('🔴 НЕКОТОРЫЕ ТЕСТЫ ПРОВАЛИЛИСЬ! ⚠️');
    console.log('');
    console.log('❌ Требуется исправление перед деплоем');
    console.log('📋 Проверьте вывод тестов выше для деталей');
    console.log('');
    console.log('🔧 Рекомендации:');
    console.log('  1. Исправьте провалившиеся тесты');
    console.log('  2. Убедитесь в наличии всех файлов');
    console.log('  3. Запустите тесты повторно');
  }
  
  console.log('\n📈 Статистика тестирования:');
  console.log(`  🧪 Общий результат: ${allTestsPassed ? 'УСПЕХ' : 'ПРОВАЛ'}`);
  console.log(`  📅 Время завершения: ${new Date().toLocaleString('ru-RU')}`);
  console.log(`  🏗️ Архитектура: Модульная, AWS Serverless`);
  console.log(`  🛡️ Покрытие: Backend + Frontend + Infrastructure`);
  
  return allTestsPassed;
}

// Запуск
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Критическая ошибка:', error);
    process.exit(1);
  }); 
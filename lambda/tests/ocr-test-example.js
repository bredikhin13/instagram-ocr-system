#!/usr/bin/env node
/**
 * Пример тестирования Google Vision API с JSON credentials
 * 
 * Использование:
 * 1. Установите GOOGLE_VISION_API_KEY (JSON или API Key)
 * 2. node tests/ocr-test-example.js
 */

// Загружаем переменные окружения (если есть .env файл)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv не установлен - это нормально
}

const { ImageAnnotatorClient } = require('@google-cloud/vision');

async function testGoogleVisionAPI() {
  console.log('🔍 Тестирование Google Vision API...');
  
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Ошибка: GOOGLE_VISION_API_KEY не установлен');
    console.log('📋 Установите переменную окружения:');
    console.log('   export GOOGLE_VISION_API_KEY=\'{"type":"service_account",...}\'');
    console.log('   или');
    console.log('   export GOOGLE_VISION_API_KEY=AIzaSy...');
    process.exit(1);
  }

  let visionClient;

  try {
    // Пытаемся парсить как JSON (Service Account)
    const credentials = JSON.parse(apiKey);
    
    console.log('✅ Обнаружен Service Account JSON');
    console.log(`📋 Project ID: ${credentials.project_id}`);
    console.log(`📋 Client Email: ${credentials.client_email}`);
    
    visionClient = new ImageAnnotatorClient({
      credentials,
      projectId: credentials.project_id
    });
    
  } catch (parseError) {
    // Если не JSON, используем как API Key
    console.log('✅ Обнаружен API Key');
    console.log(`📋 Key: ${apiKey.substring(0, 10)}...`);
    
    visionClient = new ImageAnnotatorClient({
      apiKey: apiKey.trim()
    });
  }

  try {
    // Создаем простое тестовое изображение (минимальный текст)
    const testImageBase64 = createTestImage();
    
    console.log('🔄 Отправляем тестовый запрос к Vision API...');
    
    const [result] = await visionClient.textDetection({
      image: {
        content: testImageBase64
      }
    });

    const detections = result.textAnnotations;
    
    if (detections && detections.length > 0) {
      console.log('✅ Google Vision API работает корректно!');
      console.log(`📋 Обнаружен текст: "${detections[0].description}"`);
      console.log(`📊 Количество детекций: ${detections.length}`);
    } else {
      console.log('✅ Запрос выполнен успешно, но текст не обнаружен');
      console.log('📋 Это нормально для тестового изображения');
    }
    
    console.log('🎉 Тест завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при вызове Vision API:');
    console.error(error.message);
    
    if (error.message.includes('API key not valid')) {
      console.log('💡 Решение: Проверьте корректность API ключа');
    } else if (error.message.includes('Cloud Vision API has not been used')) {
      console.log('💡 Решение: Включите Cloud Vision API в Google Cloud Console');
    } else if (error.message.includes('permission')) {
      console.log('💡 Решение: Проверьте права Service Account');
    }
    
    process.exit(1);
  }
}

function createTestImage() {
  // Простое изображение в base64 (1x1 белый пиксель)
  // В реальности это будет изображение с текстом Instagram Stories
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
}

// Запускаем тест
if (require.main === module) {
  testGoogleVisionAPI()
    .then(() => {
      console.log('');
      console.log('🚀 Готово! Google Vision API настроен корректно.');
      console.log('📋 Теперь можно запускать основные тесты: npm test');
    })
    .catch(error => {
      console.error('💥 Неожиданная ошибка:', error);
      process.exit(1);
    });
} 
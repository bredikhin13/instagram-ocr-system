// Мокируем AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@google-cloud/vision');

// Настройка переменных окружения для тестов
process.env.AWS_REGION = 'us-east-1';
process.env.ANSWERS_TABLE = 'test-answers';
process.env.STATISTICS_TABLE = 'test-statistics';
process.env.BUCKET_NAME = 'test-bucket';
process.env.GOOGLE_VISION_KEY_FILE = '/tmp/test-key.json';

// Глобальные мок-объекты
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Мок для Buffer если нужен
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
} 
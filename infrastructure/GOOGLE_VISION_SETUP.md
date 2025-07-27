# 🔑 Настройка Google Vision API для Instagram OCR System

## 📋 Поддерживаемые форматы

Система поддерживает **два формата** Google Vision API ключей:
1. **JSON Service Account** (рекомендуется) 🔐
2. **API Key** (проще в настройке) 🔑

## 🔐 JSON Service Account (рекомендуется)

### 1. Создание Service Account

1. **Перейдите в Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Создайте или выберите проект:**
   - Project name: `instagram-ocr-system`

3. **Включите Vision API:**
   - APIs & Services → Library
   - Найдите "Cloud Vision API"
   - Нажмите "Enable"

4. **Создайте Service Account:**
   - IAM & Admin → Service Accounts
   - "Create Service Account"
   - Name: `instagram-ocr-vision`
   - Description: `Service account for Instagram OCR Vision API`

5. **Настройте права:**
   - Role: `Cloud Vision AI Service Agent`
   - Или минимальные права: `ML Engine Developer`

6. **Создайте JSON ключ:**
   - Выберите созданный Service Account
   - Keys → Add Key → Create new key
   - Type: **JSON**
   - Скачайте файл

### 2. Пример JSON ключа

```json
{
  "type": "service_account",
  "project_id": "instagram-ocr-system",
  "private_key_id": "1234567890abcdef",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "instagram-ocr-vision@instagram-ocr-system.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/instagram-ocr-vision%40instagram-ocr-system.iam.gserviceaccount.com"
}
```

## 🔧 Настройка в GitHub Actions

### 1. Добавьте JSON в GitHub Secrets

1. **Перейдите в ваш GitHub репозиторий**
2. **Settings → Secrets and variables → Actions**
3. **New repository secret:**
   - Name: `GOOGLE_VISION_API_KEY`
   - Value: **Скопируйте весь JSON файл как есть**

```json
{"type":"service_account","project_id":"instagram-ocr-system",...}
```

### 2. GitHub Actions автоматически поддерживает JSON

✅ **Система автоматически определяет формат:**
- JSON → использует Service Account
- Строка → использует API Key

✅ **Безопасная передача:**
- JSON корректно экранируется в Terraform
- Environment variables настраиваются автоматически

## 💻 Локальная разработка

### 1. Через переменную окружения

```bash
# Экспортируйте JSON как переменную
export GOOGLE_VISION_API_KEY='{"type":"service_account","project_id":"your-project",...}'

# Запустите тесты
cd lambda
npm test
```

### 2. Через .env файл

```bash
# Создайте lambda/.env файл
cd lambda
echo 'GOOGLE_VISION_API_KEY={"type":"service_account",...}' > .env

# Установите dotenv
npm install -D dotenv

# Загрузите в тестах
require('dotenv').config();
```

### 3. Через файл (альтернатива)

```bash
# Сохраните JSON в файл
echo '{"type":"service_account",...}' > lambda/google-vision-key.json

# Установите переменную на путь к файлу
export GOOGLE_VISION_KEY_FILE=./google-vision-key.json
```

## 🔑 API Key (альтернатива)

### 1. Создание API Key

1. **Google Cloud Console → APIs & Services → Credentials**
2. **Create Credentials → API Key**
3. **Restrict the key:**
   - API restrictions: только "Cloud Vision API"
   - Application restrictions: по необходимости

### 2. Использование API Key

```bash
# В GitHub Secrets
GOOGLE_VISION_API_KEY=AIzaSyDaGmWKa4JsXZ-HjGw1HvSsa2TuHieyBqU

# Локально
export GOOGLE_VISION_API_KEY=AIzaSyDaGmWKa4JsXZ-HjGw1HvSsa2TuHieyBqU
```

## 🧪 Тестирование настройки

### 1. Локальный тест

```bash
cd lambda
export GOOGLE_VISION_API_KEY='YOUR_JSON_OR_API_KEY'
node -e "
const { OCRService } = require('./dist/modules/ocr');
const ocr = new OCRService();
console.log('✅ Google Vision API настроен корректно');
"
```

### 2. GitHub Actions тест

После push в репозиторий проверьте логи:
- Actions → последний workflow run
- Deploy Lambda Function → Update Lambda environment variables
- Должно быть: `Using Google Vision with Service Account credentials`

## 🛡️ Безопасность

### ✅ Рекомендации

1. **Service Account лучше API Key:**
   - Более гранулярные права
   - Можно отозвать без влияния на другие сервисы
   - Лучший аудит

2. **Минимальные права:**
   - Только Vision API
   - Только нужный проект

3. **Ротация ключей:**
   - Создавайте новые ключи каждые 90 дней
   - Удаляйте старые

4. **Мониторинг:**
   - Включите audit logs в Google Cloud
   - Отслеживайте использование API

### ❌ Чего не делать

- ❌ Не коммитьте JSON файлы в Git
- ❌ Не используйте owner/editor роли
- ❌ Не делитесь ключами в открытом виде

## 🆘 Решение проблем

### "Invalid credentials"
```bash
# Проверьте формат JSON
echo $GOOGLE_VISION_API_KEY | jq .

# Проверьте что Vision API включен
```

### "Project not found"
```bash
# Убедитесь что project_id в JSON корректный
# Проверьте что проект существует в Google Cloud
```

### "Permission denied"
```bash
# Проверьте роли Service Account
# Убедитесь что Vision API включен
```

## 📊 Стоимость

- **Первые 1,000 запросов в месяц:** Бесплатно
- **Далее:** $1.50 за 1,000 text detection запросов
- **Для тестирования:** хватит бесплатного лимита

## ✅ Готово!

После настройки у вас будет:
- 🔐 Безопасный Service Account JSON в GitHub Secrets
- 🚀 Автоматическое развертывание через GitHub Actions
- 💻 Локальная разработка с тем же ключом
- 📊 Мониторинг использования API 
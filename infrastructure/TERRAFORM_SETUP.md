# 🔧 Настройка Terraform для Instagram OCR System

## 📋 Быстрый старт

### 1. Выберите окружение

**Для тестирования (рекомендуется для начала):**
```bash
cd infrastructure
cp terraform.tfvars.dev terraform.tfvars
```

**Для продакшн:**
```bash
cd infrastructure
# terraform.tfvars уже создан
```

### 2. Настройте переменные

Отредактируйте `terraform.tfvars`:

```hcl
# ⚠️ ОБЯЗАТЕЛЬНО измените:
google_vision_api_key = "YOUR_ACTUAL_API_KEY_HERE"

# Опционально измените:
bucket_name = "your-unique-bucket-name-2025"
```

### 3. Разверните инфраструктуру

```bash
# Инициализация
terraform init

# Проверка плана
terraform plan

# Развертывание
terraform apply
```

## 🔑 Настройка Google Vision API Key

### Вариант 1: API Key (проще)

1. Перейдите на https://console.cloud.google.com/
2. Создайте проект или выберите существующий
3. Включите Vision API
4. Создайте API Key в разделе "Credentials"
5. Вставьте ключ в terraform.tfvars:

```hcl
google_vision_api_key = "AIzaSyDaGmWKa4JsXZ-HjGw1HvSsa2TuHieyBqU"
```

### Вариант 2: Service Account JSON (безопаснее)

1. Создайте Service Account
2. Скачайте JSON ключ
3. Вставьте содержимое JSON как строку:

```hcl
google_vision_api_key = "{\"type\":\"service_account\",\"project_id\":\"your-project\",...}"
```

## 📁 Конфигурационные файлы

| Файл | Назначение |
|------|------------|
| `terraform.tfvars` | Продакшн конфигурация |
| `terraform.tfvars.dev` | Dev/тестовая конфигурация |
| `terraform.tfvars.example` | Пример конфигурации |
| `variables.tf` | Описание всех переменных |

## 🎯 Переменные конфигурации

### Основные переменные

```hcl
# AWS регион
aws_region = "us-east-1"

# Окружение (dev/staging/prod)
environment = "prod"

# Название проекта
project_name = "instagram-ocr"

# S3 bucket (должен быть глобально уникальным!)
bucket_name = "instagram-ocr-uploads-prod-2025"

# Google Vision API ключ
google_vision_api_key = "YOUR_API_KEY"
```

### Опциональные переменные

```hcl
# Собственный домен
domain_name = "ocr.yourdomain.com"
acm_certificate_arn = "arn:aws:acm:..."

# Дополнительные теги
tags = {
  CostCenter = "engineering"
  Owner      = "team-name"
}
```

## 🌍 Разные окружения

### Dev окружение
```bash
cp terraform.tfvars.dev terraform.tfvars
# Измените google_vision_api_key
terraform apply
```

### Staging окружение
```bash
# Создайте terraform.tfvars.staging
environment = "staging"
bucket_name = "instagram-ocr-uploads-staging-2025"
# ...
```

### Prod окружение
```bash
# Используйте terraform.tfvars как есть
environment = "prod"
bucket_name = "instagram-ocr-uploads-prod-2025"
# ...
```

## 🔍 Проверка конфигурации

```bash
# Валидация
terraform validate

# Форматирование
terraform fmt

# План развертывания
terraform plan

# Показать outputs
terraform output
```

## 🗑️ Очистка ресурсов

**Для dev/тестового окружения:**
```bash
terraform destroy
```

**Для prod окружения:**
```bash
# Сначала сделайте backup!
terraform destroy -target=module.specific_resource
```

## ⚠️ Безопасность

1. **Не коммитьте terraform.tfvars в Git!** (уже в .gitignore)
2. **Используйте AWS IAM роли с минимальными правами**
3. **Регулярно ротируйте Google Vision API ключи**
4. **Включите CloudTrail для аудита**

## 🚀 После развертывания

1. **Получите outputs:**
   ```bash
   terraform output
   ```

2. **Настройте DNS (если используете домен):**
   ```bash
   # Добавьте CNAME запись на CloudFront домен
   ```

3. **Протестируйте систему:**
   ```bash
   # Загрузите тестовое изображение в S3
   # Проверьте CloudWatch логи
   ```

## 🆘 Решение проблем

### "Bucket already exists"
```bash
# Измените bucket_name в terraform.tfvars
bucket_name = "instagram-ocr-uploads-prod-2025-v2"
```

### "Invalid API Key"
```bash
# Проверьте что Vision API включен
# Проверьте что API Key корректный
```

### "Access denied"
```bash
# Проверьте AWS credentials
aws sts get-caller-identity
``` 
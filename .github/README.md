# 🚀 GitHub Actions CI/CD для Instagram OCR System

Эта директория содержит полный набор GitHub Actions workflows для автоматизации разработки, тестирования и развертывания Instagram OCR System в AWS.

## 📋 Обзор Workflows

### 🚀 `deploy.yml` - Основное развертывание
**Trigger:** Push в `main` ветку или ручной запуск
**Окружения:** dev, staging, prod

**Этапы:**
1. **🧪 Тестирование** - Запуск всех тестов
2. **🏗️ Сборка** - Lambda и React приложений
3. **🏗️ Развертывание инфраструктуры** - Terraform apply
4. **🔧 Развертывание Lambda** - Обновление функций
5. **🎨 Развертывание Frontend** - Загрузка в S3/CloudFront
6. **🧪 Post-Deploy тесты** - Проверка работоспособности

### 🔍 `pr-check.yml` - Проверка Pull Requests
**Trigger:** Pull Request в `main` ветку

**Проверки:**
- 🧹 Линтинг кода
- 🧪 Все тесты
- 🏗️ Сборка приложений
- ✅ Валидация Terraform
- 🔒 Сканирование безопасности

### 🔄 `rollback.yml` - Откат изменений
**Trigger:** Ручной запуск с параметрами

**Функции:**
- Откат Lambda к предыдущему коммиту
- Откат Frontend к предыдущему коммиту
- Проверка работоспособности после отката

### 🧹 `cleanup.yml` - Очистка ресурсов
**Trigger:** Ручной запуск или расписание (пятница 18:00 UTC)

**Очистка:**
- Старые версии Lambda функций
- Старые файлы в S3
- CloudWatch логи (при полной очистке)
- Кеш CloudFront

## ⚙️ Настройка

### 1. 🔐 GitHub Secrets

Настройте следующие secrets в вашем GitHub репозитории:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Google Vision API
GOOGLE_VISION_API_KEY=AIza...
```

**Как добавить secrets:**
1. Перейдите в Settings → Secrets and variables → Actions
2. Нажмите "New repository secret"
3. Добавьте каждый secret

### 2. 🌍 GitHub Environments

Создайте environments для контроля развертывания:

**Environments:**
- `dev` - Разработка (без ограничений)
- `staging` - Тестирование (требует approval)
- `prod` - Продакшн (требует approval + защищенная ветка)

**Настройка:**
1. Settings → Environments → New environment
2. Добавьте protection rules:
   - **staging/prod:** Required reviewers (1-2 человека)
   - **prod:** Deployment branches (только `main`)

### 3. 🔧 AWS IAM User

Создайте IAM пользователя с необходимыми правами:

<details>
<summary>📋 IAM Policy для GitHub Actions</summary>

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:*",
                "lambda:*",
                "dynamodb:*",
                "cloudfront:*",
                "apigateway:*",
                "iam:*",
                "logs:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole"
            ],
            "Resource": "arn:aws:iam::*:role/terraform-*"
        }
    ]
}
```
</details>

## 🚀 Использование

### Автоматическое развертывание

1. **Разработка:**
   ```bash
   git checkout -b feature/new-feature
   # Внесите изменения
   git commit -m "feat: добавил новую функцию"
   git push origin feature/new-feature
   ```
   ➜ Автоматически запустится `pr-check.yml`

2. **Merge в main:**
   ```bash
   # После review и approve PR
   git checkout main
   git merge feature/new-feature
   git push origin main
   ```
   ➜ Автоматически запустится `deploy.yml`

### Ручное развертывание

1. Перейдите в **Actions** в GitHub
2. Выберите **"Deploy Instagram OCR System to AWS"**
3. Нажмите **"Run workflow"**
4. Выберите окружение (dev/staging/prod)
5. Нажмите **"Run workflow"**

### Откат изменений

1. Перейдите в **Actions** → **"Rollback Instagram OCR System"**
2. Нажмите **"Run workflow"**
3. Заполните параметры:
   - **Environment:** окружение для отката
   - **Rollback commit:** SHA коммита для отката
   - **Confirm rollback:** введите `CONFIRM`
4. Запустите workflow

### Очистка ресурсов

**Автоматическая:** Каждую пятницу в 18:00 UTC для dev окружения

**Ручная:**
1. **Actions** → **"Cleanup AWS Resources"**
2. Выберите окружение и тип очистки
3. Введите `DELETE` для подтверждения

## 📊 Мониторинг

### Статус развертывания

**GitHub Actions Badge:**
```markdown
![Deploy Status](https://github.com/YOUR_USERNAME/instagram-ocr-system/workflows/Deploy%20Instagram%20OCR%20System%20to%20AWS/badge.svg)
```

### Уведомления

**Slack Integration** (опционально):
1. Создайте Slack Webhook
2. Добавьте `SLACK_WEBHOOK_URL` в secrets
3. Раскомментируйте секцию уведомлений в workflows

## 🔍 Отладка

### Распространенные проблемы

<details>
<summary>❌ AWS credentials не работают</summary>

**Проверьте:**
- Правильность AWS_ACCESS_KEY_ID и AWS_SECRET_ACCESS_KEY
- IAM права пользователя
- Регион AWS (по умолчанию us-east-1)

**Решение:**
```bash
# Проверьте credentials локально
aws sts get-caller-identity
```
</details>

<details>
<summary>❌ Terraform state конфликты</summary>

**Проблема:** Несколько workflows пытаются изменить инфраструктуру

**Решение:**
- Используйте Terraform Cloud или S3 backend для state
- Добавьте state locking через DynamoDB
</details>

<details>
<summary>❌ Lambda deployment timeout</summary>

**Причина:** Большой размер Lambda package

**Решение:**
- Оптимизируйте dependencies
- Используйте Lambda Layers
- Увеличьте timeout в workflow
</details>

### Логи

**Просмотр логов:**
1. GitHub Actions → выберите run → выберите job
2. CloudWatch Logs (для Lambda)
3. CloudTrail (для AWS API calls)

## 🔄 Обновления

### Обновление workflows

1. Внесите изменения в `.github/workflows/`
2. Протестируйте на feature ветке
3. Merge в main

### Обновление dependencies

**GitHub Actions:**
```yaml
# Обновите версии в workflows
uses: actions/checkout@v4  # latest
uses: actions/setup-node@v4  # latest
```

**AWS CLI/SDK:**
Автоматически используются последние версии

## 🛡️ Безопасность

### Best Practices

1. **Secrets Management:**
   - Никогда не коммитьте secrets в код
   - Используйте GitHub Secrets
   - Ротируйте ключи регулярно

2. **Environment Protection:**
   - Требуйте approval для prod
   - Ограничьте доступ к environments
   - Используйте защищенные ветки

3. **IAM Least Privilege:**
   - Минимальные необходимые права
   - Separate roles для разных environments
   - Regular audit доступов

### Security Scanning

Workflows автоматически включают:
- `npm audit` для dependencies
- Проверку на чувствительные файлы
- Terraform security validation

## 📈 Оптимизация

### Производительность

1. **Кеширование:**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'  # Кеш dependencies
   ```

2. **Параллельные job'ы:**
   - Lambda и Frontend собираются параллельно
   - Независимые тесты выполняются одновременно

3. **Incremental builds:**
   - Только измененные компоненты пересобираются

### Стоимость AWS

**Автоматическая оптимизация:**
- Cleanup старых ресурсов
- On-demand инфраструктура
- Правильные timeouts и memory limits

**Мониторинг затрат:**
- AWS Cost Explorer
- CloudWatch Billing Alarms
- Ежемесячные отчеты

## 🤝 Участие в разработке

### Добавление нового workflow

1. Создайте файл в `.github/workflows/`
2. Используйте существующие как шаблон
3. Добавьте в эту документацию
4. Протестируйте на feature ветке

### Улучшения

**Приветствуются:**
- Оптимизация производительности
- Дополнительные проверки безопасности
- Интеграции с внешними сервисами
- Улучшение мониторинга

---

## 🔗 Полезные ссылки

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)
- [Terraform GitHub Actions](https://learn.hashicorp.com/tutorials/terraform/github-actions)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

**🎉 Готово! Ваша CI/CD пайплайн настроена и готова к работе!** 
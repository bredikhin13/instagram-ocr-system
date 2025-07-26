terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket для загрузки файлов
resource "aws_s3_bucket" "instagram_ocr_bucket" {
  bucket = var.bucket_name
  
  tags = {
    Name        = "Instagram OCR Bucket"
    Environment = var.environment
    Project     = "Instagram OCR System"
  }
}

# S3 Bucket для статического сайта
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "${var.bucket_name}-frontend"
  
  tags = {
    Name        = "Instagram OCR Frontend"
    Environment = var.environment
    Project     = "Instagram OCR System"
  }
}

# Конфигурация S3 bucket для статического сайта
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Публичный доступ для frontend bucket
resource "aws_s3_bucket_public_access_block" "frontend_pab" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Политика для публичного чтения frontend bucket
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      },
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend_pab]
}

# S3 Bucket notification для Lambda
resource "aws_s3_bucket_notification" "ocr_notification" {
  bucket = aws_s3_bucket.instagram_ocr_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.ocr_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ".jpg"
  }

  lambda_function {
    lambda_function_arn = aws_lambda_function.ocr_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ".jpeg"
  }

  lambda_function {
    lambda_function_arn = aws_lambda_function.ocr_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ".png"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

# DynamoDB таблица для ответов
resource "aws_dynamodb_table" "answers" {
  name           = var.answers_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "story_id"
    type = "S"
  }

  global_secondary_index {
    name            = "story-id-index"
    hash_key        = "story_id"
    projection_type = "ALL"
  }

  tags = {
    Name        = "Instagram OCR Answers"
    Environment = var.environment
    Project     = "Instagram OCR System"
  }
}

# DynamoDB таблица для статистики
resource "aws_dynamodb_table" "statistics" {
  name           = var.statistics_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "story_id"
    type = "S"
  }

  global_secondary_index {
    name            = "story-id-index"
    hash_key        = "story_id"
    projection_type = "ALL"
  }

  tags = {
    Name        = "Instagram OCR Statistics"
    Environment = var.environment
    Project     = "Instagram OCR System"
  }
}

# IAM Role для Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy для Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.instagram_ocr_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.answers.arn,
          aws_dynamodb_table.statistics.arn,
          "${aws_dynamodb_table.answers.arn}/index/*",
          "${aws_dynamodb_table.statistics.arn}/index/*"
        ]
      }
    ]
  })
}

# Lambda Function для обработки OCR
resource "aws_lambda_function" "ocr_processor" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-ocr-processor"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda.handler"
  runtime         = "nodejs18.x"
  timeout         = 300
  memory_size     = 1024

  environment {
    variables = {
      ANSWERS_TABLE      = aws_dynamodb_table.answers.name
      STATISTICS_TABLE   = aws_dynamodb_table.statistics.name
      BUCKET_NAME        = aws_s3_bucket.instagram_ocr_bucket.bucket
      GOOGLE_VISION_KEY  = var.google_vision_api_key
    }
  }

  tags = {
    Name        = "Instagram OCR Processor"
    Environment = var.environment
    Project     = "Instagram OCR System"
  }
}

# Lambda Permission для S3
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ocr_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.instagram_ocr_bucket.arn
}

# API Gateway для REST API
resource "aws_api_gateway_rest_api" "instagram_ocr_api" {
  name        = "${var.project_name}-api"
  description = "API for Instagram OCR System"

  cors_configuration {
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST", "OPTIONS"]
    allow_headers     = ["Content-Type", "Authorization"]
    expose_headers    = []
    max_age          = 300
    allow_credentials = false
  }
}

# API Gateway Resource - stories
resource "aws_api_gateway_resource" "stories" {
  rest_api_id = aws_api_gateway_rest_api.instagram_ocr_api.id
  parent_id   = aws_api_gateway_rest_api.instagram_ocr_api.root_resource_id
  path_part   = "stories"
}

# API Gateway Resource - story by ID
resource "aws_api_gateway_resource" "story_by_id" {
  rest_api_id = aws_api_gateway_rest_api.instagram_ocr_api.id
  parent_id   = aws_api_gateway_resource.stories.id
  path_part   = "{story_id}"
}

# API Gateway Resource - statistics
resource "aws_api_gateway_resource" "statistics" {
  rest_api_id = aws_api_gateway_rest_api.instagram_ocr_api.id
  parent_id   = aws_api_gateway_resource.story_by_id.id
  path_part   = "statistics"
}

# Lambda Function для API
resource "aws_lambda_function" "api_handler" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-api-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda.getStatisticsHandler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      ANSWERS_TABLE      = aws_dynamodb_table.answers.name
      STATISTICS_TABLE   = aws_dynamodb_table.statistics.name
      BUCKET_NAME        = aws_s3_bucket.instagram_ocr_bucket.bucket
    }
  }

  tags = {
    Name        = "Instagram OCR API Handler"
    Environment = var.environment
    Project     = "Instagram OCR System"
  }
}

# CloudFront Distribution для frontend
resource "aws_cloudfront_distribution" "frontend_distribution" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend_bucket.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend_bucket.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "Instagram OCR Frontend"
    Environment = var.environment
    Project     = "Instagram OCR System"
  }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "frontend_oai" {
  comment = "OAI for Instagram OCR Frontend"
} 
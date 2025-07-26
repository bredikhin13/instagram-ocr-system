variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "instagram-ocr"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for file uploads"
  type        = string
  default     = "instagram-ocr-uploads"
}

variable "answers_table_name" {
  description = "Name of the DynamoDB table for answers"
  type        = string
  default     = "instagram-ocr-answers"
}

variable "statistics_table_name" {
  description = "Name of the DynamoDB table for statistics"
  type        = string
  default     = "instagram-ocr-statistics"
}

variable "lambda_zip_path" {
  description = "Path to the Lambda deployment package"
  type        = string
  default     = "../lambda/lambda.zip"
}

variable "google_vision_api_key" {
  description = "Google Vision API key or service account JSON"
  type        = string
  sensitive   = true
  default     = ""
}

variable "domain_name" {
  description = "Custom domain name for the frontend (optional)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain (optional)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
} 
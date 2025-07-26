output "s3_bucket_name" {
  description = "Name of the S3 bucket for file uploads"
  value       = aws_s3_bucket.instagram_ocr_bucket.bucket
}

output "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend_bucket.bucket
}

output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend_distribution.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend_distribution.id
}

output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = aws_api_gateway_rest_api.instagram_ocr_api.execution_arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function for OCR processing"
  value       = aws_lambda_function.ocr_processor.function_name
}

output "api_lambda_function_name" {
  description = "Name of the Lambda function for API handling"
  value       = aws_lambda_function.api_handler.function_name
}

output "dynamodb_answers_table_name" {
  description = "Name of the DynamoDB table for answers"
  value       = aws_dynamodb_table.answers.name
}

output "dynamodb_statistics_table_name" {
  description = "Name of the DynamoDB table for statistics"
  value       = aws_dynamodb_table.statistics.name
}

output "dynamodb_answers_table_arn" {
  description = "ARN of the DynamoDB table for answers"
  value       = aws_dynamodb_table.answers.arn
}

output "dynamodb_statistics_table_arn" {
  description = "ARN of the DynamoDB table for statistics"
  value       = aws_dynamodb_table.statistics.arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_role.arn
}

output "website_url" {
  description = "Website URL (CloudFront distribution)"
  value       = "https://${aws_cloudfront_distribution.frontend_distribution.domain_name}"
}

output "s3_website_url" {
  description = "Direct S3 website URL"
  value       = "http://${aws_s3_bucket.frontend_bucket.bucket}.s3-website-${var.aws_region}.amazonaws.com"
}

# Environment configuration for frontend
output "frontend_env_config" {
  description = "Environment configuration for frontend deployment"
  value = {
    VITE_API_BASE_URL = "https://${aws_api_gateway_rest_api.instagram_ocr_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod"
    VITE_AWS_REGION   = var.aws_region
    VITE_S3_BUCKET    = aws_s3_bucket.instagram_ocr_bucket.bucket
  }
}

# Instructions for deployment
output "deployment_instructions" {
  description = "Instructions for deploying the application"
  value = {
    lambda_build = "cd lambda && npm run build && npm run package"
    lambda_deploy = "terraform apply"
    frontend_build = "cd frontend && npm run build"
    frontend_deploy = "aws s3 sync frontend/dist/ s3://${aws_s3_bucket.frontend_bucket.bucket}/ --delete"
    cache_invalidation = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.frontend_distribution.id} --paths '/*'"
  }
} 
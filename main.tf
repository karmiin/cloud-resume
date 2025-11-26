terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "terraform-state-cloud-resume-lock"
    key = "cloud-resume/terraform.tfstate"
    region = "eu-central-1"
  }
}

provider "aws" {
  region = "eu-central-1"
}


resource "aws_s3_bucket" "resume_bucket" {

  bucket = "cloud-resume-challenge-karmin-2025" 
}

resource "aws_s3_bucket_public_access_block" "resume_bucket_public_access" {
  bucket = aws_s3_bucket.resume_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "resume_bucket_policy" {
  bucket = aws_s3_bucket.resume_bucket.id
  
  depends_on = [aws_s3_bucket_public_access_block.resume_bucket_public_access]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.resume_bucket.arn}/*"
      },
    ]
  })
}

resource "aws_s3_bucket_website_configuration" "resume_bucket_website" {
  bucket = aws_s3_bucket.resume_bucket.id

  index_document {
    suffix = "index.html"
  }
}

output "website_url" {
  value = aws_s3_bucket_website_configuration.resume_bucket_website.website_endpoint
}



resource "aws_cloudfront_distribution" "s3_distribution" {
  aliases = ["karmin.dev", "www.karmin.dev"]

  origin {
    domain_name = aws_s3_bucket_website_configuration.resume_bucket_website.website_endpoint
    origin_id   = "S3-Website-${aws_s3_bucket.resume_bucket.id}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Website-${aws_s3_bucket.resume_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https" # Se uno entra in HTTP, lo forza su HTTPS
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none" # Accessibile da tutto il mondo
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}


output "cloudfront_url" {
  value = aws_cloudfront_distribution.s3_distribution.domain_name
}


resource "aws_iam_role" "lambda_exec_role" {
  name = "serverless_rust_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


resource "aws_lambda_function" "rust_backend" {
  function_name = "rust-backend-function"


  filename         = "${path.module}/backend/target/lambda/backend/bootstrap.zip"
  source_code_hash = filebase64sha256("${path.module}/backend/target/lambda/backend/bootstrap.zip")


  handler       = "bootstrap"
  runtime       = "provided.al2023"
  architectures = ["x86_64"] 

  role = aws_iam_role.lambda_exec_role.arn
  environment {
    variables = {
      SPOTIFY_CLIENT_ID = var.spotify_client_id
      SPOTIFY_CLIENT_SECRET = var.spotify_client_secret
      SPOTIFY_REFRESH_TOKEN = var.spotify_refresh_token
      TELEGRAM_TOKEN = var.telegram_token
      TELEGRAM_CHAT_ID = var.telegram_chat_id
    }
  }
}
variable "spotify_client_id" {
  type = string
  sensitive = true
}
variable "spotify_client_secret" {
  type = string
  sensitive = true
}
variable "spotify_refresh_token" {
  type = string
  sensitive = true
}


resource "aws_lambda_function_url" "backend_url" {
  function_name      = aws_lambda_function.rust_backend.function_name
  authorization_type = "NONE"

  cors {
     allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date", "content-type"]
    max_age           = 86400
  }
}


output "api_url" {
  value = aws_lambda_function_url.backend_url.function_url
}


resource "aws_dynamodb_table" "visitor_table" {
  name           = "VisitorCount"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table_item" "init_count" {
  table_name = aws_dynamodb_table.visitor_table.name
  hash_key   = aws_dynamodb_table.visitor_table.hash_key

  item = <<ITEM
{
  "id": {"S": "count"},
  "visits": {"N": "0"}
}
ITEM
}

resource "aws_iam_policy" "lambda_dynamo_policy" {
  name        = "lambda_dynamo_policy"
  description = "Permette alla Lambda di leggere e scrivere su DynamoDB"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.visitor_table.arn
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dynamo_attach" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_dynamo_policy.arn
}

output "resume_bucket_name" {
  value = aws_s3_bucket.resume_bucket.id
}

//output cloudfront id
output "cloudfront_id" {
  value = aws_cloudfront_distribution.s3_distribution.id
}

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.karmin.dev"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}
resource "aws_route53_record" "apex" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "karmin.dev"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}
provider "aws" {
  alias = "virginia"
  region = "us-east-1"
}

data "aws_acm_certificate" "cert" {
  domain = "karmin.dev"
  statuses = ["ISSUED"]
  provider = aws.virginia
}
data "aws_route53_zone" "main"{
  name = "karmin.dev"
}

variable "telegram_token" {
  type = string
  sensitive = true
}
variable "telegram_chat_id" {
  type = string
  sensitive = true
}

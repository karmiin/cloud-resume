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

# 1. Creiamo il Bucket
resource "aws_s3_bucket" "resume_bucket" {
  # Cambia questo nome, deve essere UNICO al mondo (es. aggiungi data o numeri)
  bucket = "cloud-resume-challenge-karmin-2025" 
}

# 2. Sblocchiamo l'accesso pubblico (AWS di default blocca tutto per sicurezza)
resource "aws_s3_bucket_public_access_block" "resume_bucket_public_access" {
  bucket = aws_s3_bucket.resume_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# 3. Creiamo una Policy che dice: "Chiunque (*) può LEGGERE (GetObject) i file"
resource "aws_s3_bucket_policy" "resume_bucket_policy" {
  bucket = aws_s3_bucket.resume_bucket.id
  
  # Questa dipendenza serve a dire a Terraform: 
  # "Non applicare la policy prima di aver sbloccato l'accesso pubblico al punto 2"
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

# 4. Configuriamo il bucket per funzionare come sito web
resource "aws_s3_bucket_website_configuration" "resume_bucket_website" {
  bucket = aws_s3_bucket.resume_bucket.id

  index_document {
    suffix = "index.html"
  }
}

# 5. Output: Alla fine Terraform ci stampa l'URL del sito
output "website_url" {
  value = aws_s3_bucket_website_configuration.resume_bucket_website.website_endpoint
}


# 6. Creiamo la distribuzione CloudFront (CDN)
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

# 7. Output del nuovo link CloudFront
output "cloudfront_url" {
  value = aws_cloudfront_distribution.s3_distribution.domain_name
}


# --- PARTE BACKEND (Lambda + Rust) ---

# 1. Creiamo il Ruolo IAM (il "pass") che permette alla Lambda di girare
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

# 2. Attacchiamo al ruolo il permesso di scrivere i log (fondamentale per il debug)
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 3. La Funzione Lambda vera e propria
resource "aws_lambda_function" "rust_backend" {
  function_name = "rust-backend-function"

  # Percorso dello zip creato da cargo lambda
  filename         = "${path.module}/backend/target/lambda/backend/bootstrap.zip"
  source_code_hash = filebase64sha256("${path.module}/backend/target/lambda/backend/bootstrap.zip")

  # Configurazione Runtime per Rust (che su AWS si chiama "provided.al2")
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  architectures = ["x86_64"] # O "arm64" se hai compilato su Mac M1/M2/M3

  role = aws_iam_role.lambda_exec_role.arn
  environment {
    variables = {
      SPOTIFY_CLIENT_ID = var.spotify_client_id
      SPOTIFY_CLIENT_SECRET = var.spotify_client_secret
      SPOTIFY_REFRESH_TOKEN = var.spotify_refresh_token
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

# 4. Function URL (Il modo più veloce per esporre la Lambda su internet senza API Gateway complesso)
resource "aws_lambda_function_url" "backend_url" {
  function_name      = aws_lambda_function.rust_backend.function_name
  authorization_type = "NONE" # Pubblico

  cors {
     allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["date", "keep-alive"]
    expose_headers    = ["keep-alive", "date"]
    max_age           = 86400
  }
}

# 5. Output dell'URL del Backend
output "api_url" {
  value = aws_lambda_function_url.backend_url.function_url
}

# --- PARTE DATABASE (DynamoDB) ---

# 1. Creiamo la tabella
resource "aws_dynamodb_table" "visitor_table" {
  name           = "VisitorCount"
  billing_mode   = "PAY_PER_REQUEST" # Paghi solo se la usi (gratis col free tier)
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S" # S sta per Stringa
  }
}

# 2. Inizializziamo la tabella con il valore 0 (Opzionale ma utile)
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

# --- PERMESSI (Fondamentale!) ---
# Senza questo pezzo, la Lambda proverà a leggere il DB e AWS le dirà "Access Denied".

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

# Attacchiamo la policy al ruolo della Lambda creato prima
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


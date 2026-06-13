variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "jwt_secret" {
  description = "Secret key for signing JWTs — set in terraform.tfvars, never commit"
  type        = string
  sensitive   = true
}

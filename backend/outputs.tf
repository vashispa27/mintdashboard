output "api_url" {
  description = "Set this as NEXT_PUBLIC_API_URL in .env.local"
  value       = aws_apigatewayv2_stage.prod.invoke_url
}

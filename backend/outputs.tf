output "api_url" {
  description = "Set this as NEXT_PUBLIC_API_URL in .env.local"
  value       = aws_apigatewayv2_stage.prod.invoke_url
}

output "iot_endpoint" {
  description = "Set this as SENTINEL_IOT_ENDPOINT in the client"
  value       = data.aws_iot_endpoint.endpoint.endpoint_address
}

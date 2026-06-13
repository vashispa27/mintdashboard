resource "aws_apigatewayv2_api" "mint_api" {
  name          = "mint-dashboard-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.mint_api.id
  name        = "prod"
  auto_deploy = true
}

# ── Integrations ──────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "get_repos" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_repos.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get_repo_metadata" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_repo_metadata.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get_file_content" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_file_content.invoke_arn
  payload_format_version = "2.0"
}

# ── Routes ────────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_route" "get_repos" {
  api_id    = aws_apigatewayv2_api.mint_api.id
  route_key = "POST /repos"
  target    = "integrations/${aws_apigatewayv2_integration.get_repos.id}"
}

resource "aws_apigatewayv2_route" "get_repo_metadata" {
  api_id    = aws_apigatewayv2_api.mint_api.id
  route_key = "POST /repos/{repoId}/tree"
  target    = "integrations/${aws_apigatewayv2_integration.get_repo_metadata.id}"
}

resource "aws_apigatewayv2_route" "get_file_content" {
  api_id    = aws_apigatewayv2_api.mint_api.id
  route_key = "POST /repos/{repoId}/file"
  target    = "integrations/${aws_apigatewayv2_integration.get_file_content.id}"
}

# ── Session integrations ───────────────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "session_start" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.session_start.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "session_end" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.session_end.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "sessions_list" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.sessions_list.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "session_get" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.session_get.invoke_arn
  payload_format_version = "2.0"
}

# ── Session routes ─────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_route" "session_start" {
  api_id    = aws_apigatewayv2_api.mint_api.id
  route_key = "POST /sessions/start"
  target    = "integrations/${aws_apigatewayv2_integration.session_start.id}"
}

resource "aws_apigatewayv2_route" "session_end" {
  api_id    = aws_apigatewayv2_api.mint_api.id
  route_key = "POST /sessions/end"
  target    = "integrations/${aws_apigatewayv2_integration.session_end.id}"
}

resource "aws_apigatewayv2_route" "sessions_list" {
  api_id    = aws_apigatewayv2_api.mint_api.id
  route_key = "POST /sessions/list"
  target    = "integrations/${aws_apigatewayv2_integration.sessions_list.id}"
}

resource "aws_apigatewayv2_route" "session_get" {
  api_id    = aws_apigatewayv2_api.mint_api.id
  route_key = "POST /sessions/get"
  target    = "integrations/${aws_apigatewayv2_integration.session_get.id}"
}

# ── Auth routes ────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "auth_login" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.auth_login.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "auth_register" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.auth_register.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "auth_login" {
  api_id    = aws_apigatewayv2_api.mint_api.id
  route_key = "POST /auth/login"
  target    = "integrations/${aws_apigatewayv2_integration.auth_login.id}"
}

resource "aws_apigatewayv2_route" "auth_register" {
  api_id    = aws_apigatewayv2_api.mint_api.id
  route_key = "POST /auth/register"
  target    = "integrations/${aws_apigatewayv2_integration.auth_register.id}"
}

resource "aws_apigatewayv2_api" "mint_api" {
  name          = "mint-dashboard-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.mint_api.id
  name        = "prod"
  auto_deploy = true
}

# ── Lambda authorizer ─────────────────────────────────────────────────────────

resource "aws_apigatewayv2_authorizer" "api_key" {
  api_id                            = aws_apigatewayv2_api.mint_api.id
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.api_authorizer.invoke_arn
  authorizer_payload_format_version = "2.0"
  authorizer_result_ttl_in_seconds  = 300
  identity_sources                  = ["$request.header.Authorization"]
  name                              = "api-key-authorizer"
  enable_simple_responses           = true
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
  api_id             = aws_apigatewayv2_api.mint_api.id
  route_key          = "POST /repos"
  target             = "integrations/${aws_apigatewayv2_integration.get_repos.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

resource "aws_apigatewayv2_route" "get_repo_metadata" {
  api_id             = aws_apigatewayv2_api.mint_api.id
  route_key          = "POST /repos/{repoId}/tree"
  target             = "integrations/${aws_apigatewayv2_integration.get_repo_metadata.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

resource "aws_apigatewayv2_route" "get_file_content" {
  api_id             = aws_apigatewayv2_api.mint_api.id
  route_key          = "POST /repos/{repoId}/file"
  target             = "integrations/${aws_apigatewayv2_integration.get_file_content.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
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
  api_id             = aws_apigatewayv2_api.mint_api.id
  route_key          = "POST /sessions/start"
  target             = "integrations/${aws_apigatewayv2_integration.session_start.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

resource "aws_apigatewayv2_route" "session_end" {
  api_id             = aws_apigatewayv2_api.mint_api.id
  route_key          = "POST /sessions/end"
  target             = "integrations/${aws_apigatewayv2_integration.session_end.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

resource "aws_apigatewayv2_route" "sessions_list" {
  api_id             = aws_apigatewayv2_api.mint_api.id
  route_key          = "POST /sessions/list"
  target             = "integrations/${aws_apigatewayv2_integration.sessions_list.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

resource "aws_apigatewayv2_route" "session_get" {
  api_id             = aws_apigatewayv2_api.mint_api.id
  route_key          = "POST /sessions/get"
  target             = "integrations/${aws_apigatewayv2_integration.session_get.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
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

# ── Transcript routes ──────────────────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "get_session_transcript" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_session_transcript.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "put_session_transcript" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.put_session_transcript.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_session_transcript" {
  api_id             = aws_apigatewayv2_api.mint_api.id
  route_key          = "POST /sessions/transcript"
  target             = "integrations/${aws_apigatewayv2_integration.get_session_transcript.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

resource "aws_apigatewayv2_route" "put_session_transcript" {
  api_id             = aws_apigatewayv2_api.mint_api.id
  route_key          = "POST /sessions/transcript/upload"
  target             = "integrations/${aws_apigatewayv2_integration.put_session_transcript.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

# ── API key management routes ──────────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "create_api_key" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.create_api_key.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "list_api_keys" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.list_api_keys.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "revoke_api_key" {
  api_id                 = aws_apigatewayv2_api.mint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.revoke_api_key.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "create_api_key" {
  api_id    = aws_apigatewayv2_api.mint_api.id
  route_key = "POST /keys/create"
  target    = "integrations/${aws_apigatewayv2_integration.create_api_key.id}"
}

resource "aws_apigatewayv2_route" "list_api_keys" {
  api_id             = aws_apigatewayv2_api.mint_api.id
  route_key          = "POST /keys/list"
  target             = "integrations/${aws_apigatewayv2_integration.list_api_keys.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

resource "aws_apigatewayv2_route" "revoke_api_key" {
  api_id             = aws_apigatewayv2_api.mint_api.id
  route_key          = "POST /keys/revoke"
  target             = "integrations/${aws_apigatewayv2_integration.revoke_api_key.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
  authorization_type = "CUSTOM"
}

data "archive_file" "lambdas" {
  type        = "zip"
  source_dir  = "${path.module}/lambdas"
  output_path = "${path.module}/.build/lambdas.zip"
}

locals {
  lambda_common = {
    filename         = data.archive_file.lambdas.output_path
    source_code_hash = data.archive_file.lambdas.output_base64sha256
    runtime          = "nodejs20.x"
    role             = aws_iam_role.lambda_role.arn
    timeout          = 30
    memory_size      = 256
    architectures    = ["arm64"]
  }
}

resource "aws_lambda_function" "get_repos" {
  function_name    = "mint-getRepos"
  handler          = "getRepos.handler"
  filename         = local.lambda_common.filename
  source_code_hash = local.lambda_common.source_code_hash
  runtime          = local.lambda_common.runtime
  role             = local.lambda_common.role
  timeout          = local.lambda_common.timeout
  memory_size      = local.lambda_common.memory_size
  architectures    = local.lambda_common.architectures
}

resource "aws_lambda_function" "get_repo_metadata" {
  function_name    = "mint-getRepoMetadata"
  handler          = "getRepoMetadata.handler"
  filename         = local.lambda_common.filename
  source_code_hash = local.lambda_common.source_code_hash
  runtime          = local.lambda_common.runtime
  role             = local.lambda_common.role
  timeout          = local.lambda_common.timeout
  memory_size      = local.lambda_common.memory_size
  architectures    = local.lambda_common.architectures
}

resource "aws_lambda_function" "get_file_content" {
  function_name    = "mint-getFileContent"
  handler          = "getFileContent.handler"
  filename         = local.lambda_common.filename
  source_code_hash = local.lambda_common.source_code_hash
  runtime          = local.lambda_common.runtime
  role             = local.lambda_common.role
  timeout          = local.lambda_common.timeout
  memory_size      = local.lambda_common.memory_size
  architectures    = local.lambda_common.architectures
}

resource "aws_lambda_permission" "get_repos" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_repos.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mint_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_repo_metadata" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_repo_metadata.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mint_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_file_content" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_file_content.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mint_api.execution_arn}/*/*"
}

# ── Session lambdas ────────────────────────────────────────────────────────────

locals {
  sessions_env = {
    SESSIONS_TABLE = aws_dynamodb_table.sessions.name
  }
  auth_env = {
    USERS_TABLE = aws_dynamodb_table.users.name
    JWT_SECRET  = var.jwt_secret
  }
}

resource "aws_lambda_function" "session_start" {
  function_name    = "mint-sessionStart"
  handler          = "sessionStart.handler"
  filename         = local.lambda_common.filename
  source_code_hash = local.lambda_common.source_code_hash
  runtime          = local.lambda_common.runtime
  role             = local.lambda_common.role
  timeout          = local.lambda_common.timeout
  memory_size      = local.lambda_common.memory_size
  architectures    = local.lambda_common.architectures
  environment { variables = local.sessions_env }
}

resource "aws_lambda_function" "session_end" {
  function_name    = "mint-sessionEnd"
  handler          = "sessionEnd.handler"
  filename         = local.lambda_common.filename
  source_code_hash = local.lambda_common.source_code_hash
  runtime          = local.lambda_common.runtime
  role             = local.lambda_common.role
  timeout          = local.lambda_common.timeout
  memory_size      = local.lambda_common.memory_size
  architectures    = local.lambda_common.architectures
  environment { variables = local.sessions_env }
}

resource "aws_lambda_function" "sessions_list" {
  function_name    = "mint-sessionsList"
  handler          = "sessionsList.handler"
  filename         = local.lambda_common.filename
  source_code_hash = local.lambda_common.source_code_hash
  runtime          = local.lambda_common.runtime
  role             = local.lambda_common.role
  timeout          = local.lambda_common.timeout
  memory_size      = local.lambda_common.memory_size
  architectures    = local.lambda_common.architectures
  environment { variables = local.sessions_env }
}

resource "aws_lambda_function" "session_get" {
  function_name    = "mint-sessionGet"
  handler          = "sessionGet.handler"
  filename         = local.lambda_common.filename
  source_code_hash = local.lambda_common.source_code_hash
  runtime          = local.lambda_common.runtime
  role             = local.lambda_common.role
  timeout          = local.lambda_common.timeout
  memory_size      = local.lambda_common.memory_size
  architectures    = local.lambda_common.architectures
  environment { variables = local.sessions_env }
}

resource "aws_lambda_permission" "session_start" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.session_start.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mint_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "session_end" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.session_end.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mint_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "sessions_list" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sessions_list.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mint_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "session_get" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.session_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mint_api.execution_arn}/*/*"
}

# ── Auth + IoT lambdas ─────────────────────────────────────────────────────────

resource "aws_lambda_function" "auth_login" {
  function_name    = "mint-authLogin"
  handler          = "authLogin.handler"
  filename         = local.lambda_common.filename
  source_code_hash = local.lambda_common.source_code_hash
  runtime          = local.lambda_common.runtime
  role             = local.lambda_common.role
  timeout          = local.lambda_common.timeout
  memory_size      = local.lambda_common.memory_size
  architectures    = local.lambda_common.architectures
  environment { variables = local.auth_env }
}

resource "aws_lambda_function" "auth_register" {
  function_name    = "mint-authRegister"
  handler          = "authRegister.handler"
  filename         = local.lambda_common.filename
  source_code_hash = local.lambda_common.source_code_hash
  runtime          = local.lambda_common.runtime
  role             = local.lambda_common.role
  timeout          = local.lambda_common.timeout
  memory_size      = local.lambda_common.memory_size
  architectures    = local.lambda_common.architectures
  environment { variables = local.auth_env }
}

resource "aws_lambda_function" "iot_authorizer" {
  function_name    = "mint-iotAuthorizer"
  handler          = "iotAuthorizer.handler"
  filename         = local.lambda_common.filename
  source_code_hash = local.lambda_common.source_code_hash
  runtime          = local.lambda_common.runtime
  role             = local.lambda_common.role
  timeout          = local.lambda_common.timeout
  memory_size      = local.lambda_common.memory_size
  architectures    = local.lambda_common.architectures
  environment { variables = { JWT_SECRET = var.jwt_secret } }
}

resource "aws_lambda_permission" "auth_login" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_login.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mint_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "auth_register" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_register.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.mint_api.execution_arn}/*/*"
}

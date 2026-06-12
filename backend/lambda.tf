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

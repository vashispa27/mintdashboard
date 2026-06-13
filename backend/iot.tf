data "aws_iot_endpoint" "endpoint" {
  endpoint_type = "iot:Data-ATS"
}

resource "aws_iot_authorizer" "sentinel" {
  name                    = "sentinel-jwt-authorizer"
  authorizer_function_arn = aws_lambda_function.iot_authorizer.arn
  signing_disabled        = true
  status                  = "ACTIVE"
  token_key_name          = "token"
}

resource "aws_lambda_permission" "iot_authorizer" {
  statement_id  = "AllowIoTCore"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.iot_authorizer.function_name
  principal     = "iot.amazonaws.com"
}

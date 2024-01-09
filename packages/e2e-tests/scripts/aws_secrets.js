/* Copyright 2024 Record Replay Inc. */

const { execSync } = require("child_process");

function getSecret(key, region) {
  return execSync(
    `aws secretsmanager get-secret-value --secret-id "${key}" --region ${region} --output json --query "SecretString"`
  )
    .toString()
    .trim()
    .replaceAll('"', "");
}

module.exports = getSecret;

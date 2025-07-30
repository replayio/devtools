/* Copyright 2024 Record Replay Inc. */

import { execSync } from "child_process";

export function getSecret(key: string, region: string) {
  return execSync(
    `aws secretsmanager get-secret-value --secret-id "${key}" --region ${region} --output json --query "SecretString"`
  )
    .toString()
    .trim()
    .replace(/"/g, "");
}

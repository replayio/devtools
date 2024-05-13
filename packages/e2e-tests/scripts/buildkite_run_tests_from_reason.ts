/* Copyright 2020-2024 Record Replay Inc. */

import * as path from "path";
import { execSync } from "child_process";

import { getSecret } from "./aws_secrets";
import {
  detectAndRecordBuildReason,
  fetchRuntimeBuildIdFromChromiumBuildId,
  fetchRuntimeBuildIdFromChromiumBuildNumber,
  fetchLatestChromiumBuildOnBranch,
} from "./detect_and_record_build_reason";

function build(os, arch, runtimeBuildId) {
  process.env.RUNTIME_BUILD_ID = runtimeBuildId;
  process.env.OS = os;

  if (!process.env.HASURA_ADMIN_SECRET) {
    process.env.HASURA_ADMIN_SECRET = getSecret("prod/hasura-admin-secret", "us-east-2");
  }

  const scriptPath = path.join(
    process.env.BUILDKITE_BUILD_CHECKOUT_PATH,
    "scripts",
    "chromium",
    "tests",
    "buildkite_run_tests.js"
  );
  execSync(`node ${scriptPath} ${process.env.RUNTIME_TEST_FILE}`, { stdio: "inherit" });
}

function buildUrl(pipelineSlug, buildNumber) {
  return `https://buildkite.com/replay/${pipelineSlug}/builds/${buildNumber}`;
}

function describeReason(markdownMessage, rebuild) {
  // do something with `rebuild` here...
  execSync(`buildkite-agent annotate --style info "${markdownMessage}"`, {
    stdio: "inherit",
  });
}

export async function build_from_reason(os, arch) {
  const buildReason = await detectAndRecordBuildReason();

  if (!process.env.BUILDKITE_TOKEN) {
    process.env.BUILDKITE_TOKEN = getSecret(
      "prod/buildkite-retry-graphql-token",
      "us-east-2"
    );
  }

  switch (buildReason.reason) {
    case "runtime-chromium-build-id": {
      describeReason(
        `Testing against chromium buildid ${buildReason.chromiumBuildId}`,
        buildReason.rebuild
      );
      build(os, arch, buildReason.chromiumBuildId);
      break;
    }
    case "chromium-build-number": {
      describeReason(
        `Testing against chromium build number [#${buildReason.buildNumber}](${buildUrl(
          "chromium-build",
          buildReason.buildNumber
        )})`,
        buildReason.rebuild
      );
      const runtimeBuildId = await fetchRuntimeBuildIdFromChromiumBuildNumber(
        os,
        arch,
        buildReason.buildNumber
      );
      build(os, arch, runtimeBuildId);
      break;
    }
    case "chromium-branch": {
      const buildkiteToken = process.env.BUILDKITE_TOKEN;
      if (!buildkiteToken) {
        throw new Error("Missing BUILDKITE_TOKEN");
      }

      const { buildId, buildNumber } = await fetchLatestChromiumBuildOnBranch(
        buildkiteToken,
        buildReason.branch
      );
      describeReason(
        `Testing against latest chromium build on branch \\\`${
          buildReason.branch
        }\\\`: [#${buildNumber}](${buildUrl("chromium-build", buildNumber)})`,
        buildReason.rebuild
      );
      const runtimeBuildId = await fetchRuntimeBuildIdFromChromiumBuildId(
        os,
        arch,
        buildId
      );
      build(os, arch, runtimeBuildId);
      break;
    }
    case "triggered": {
      describeReason(
        `Testing triggered from [${buildReason.pipelineSlug}#${
          buildReason.buildNumber
        }](${buildUrl(buildReason.pipelineSlug, buildReason.buildNumber)})`,
        buildReason.rebuild
      );
      const runtimeBuildId = await fetchRuntimeBuildIdFromChromiumBuildId(
        os,
        arch,
        buildReason.buildId
      );
      build(os, arch, runtimeBuildId);
      break;
    }
    default:
      throw new Error(`Unknown build reason: ${JSON.stringify(buildReason)}`);
  }
}

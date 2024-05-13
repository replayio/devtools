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

import { install_build_products } from "./build_products";
import run_fe_tests from "./buildkite_run_fe_tests";

function run_fe_tests_from_build_id(os: string, arch:  string, runtimeBuildId: string) {
  console.group("BUILD PREP");
  console.time("BUILD PREP");
  process.env.RUNTIME_BUILD_ID = runtimeBuildId;
  let CHROME_BINARY_PATH = install_build_products(runtimeBuildId, os, arch);
  console.timeEnd("BUILD PREP");
  console.groupEnd();

  run_fe_tests(CHROME_BINARY_PATH);
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
      run_fe_tests_from_build_id(os, arch, buildReason.chromiumBuildId);
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
      run_fe_tests_from_build_id(os, arch, runtimeBuildId);
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
      run_fe_tests_from_build_id(os, arch, runtimeBuildId);
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
      run_fe_tests_from_build_id(os, arch, runtimeBuildId);
      break;
    }
    default:
      throw new Error(`Unknown build reason: ${JSON.stringify(buildReason)}`);
  }
}

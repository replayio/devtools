/* Copyright 2024 Record Replay Inc. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

export function build_id_from_artifact(os, arch) {
  const buildIdPath = path.join("build_id", os, arch, "build_id");

  execSync(
    `buildkite-agent artifact download ${buildIdPath} . --build ` +
      process.env.BUILDKITE_TRIGGERED_FROM_BUILD_ID
  );

  return fs.readFileSync(buildIdPath, "utf8").trim();
}

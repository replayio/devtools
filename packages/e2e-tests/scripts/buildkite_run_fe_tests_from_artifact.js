/* Copyright 2024 Record Replay Inc. */

const build_id_from_artifact = require("./build_id_from_artifact");
const install_build_products = require("./build_products");
const run_fe_tests = require("./buildkite_run_fe_tests");

function run_fe_tests_from_artifact(PLATFORM, ARCH) {
  let RUNTIME_BUILD_ID = build_id_from_artifact(PLATFORM, ARCH);
  let CHROME_BINARY_PATH = install_build_products(RUNTIME_BUILD_ID, PLATFORM, ARCH);

  run_fe_tests(CHROME_BINARY_PATH);
}

module.exports = run_fe_tests_from_artifact;

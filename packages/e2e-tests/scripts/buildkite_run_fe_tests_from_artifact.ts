/* Copyright 2024 Record Replay Inc. */

import { build_id_from_artifact } from "./build_id_from_artifact";
import { install_build_products } from "./build_products";
import run_fe_tests from "./buildkite_run_fe_tests";

export default function run_fe_tests_from_artifact(PLATFORM, ARCH) {
  console.group("BUILD PREP");
  console.time("BUILD PREP");
  let RUNTIME_BUILD_ID = process.env.RUNTIME_BUILD_ID;
  if (!RUNTIME_BUILD_ID) {
    RUNTIME_BUILD_ID = build_id_from_artifact(PLATFORM, ARCH);
  }
  let CHROME_BINARY_PATH = install_build_products(RUNTIME_BUILD_ID, PLATFORM, ARCH);
  console.timeEnd("BUILD PREP");
  console.groupEnd();

  run_fe_tests(CHROME_BINARY_PATH);
}

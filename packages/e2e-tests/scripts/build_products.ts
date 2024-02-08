/* Copyright 2024 Record Replay Inc. */

import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

export function install_build_products(RUNTIME_BUILD_ID, PLATFORM, ARCHITECTURE) {
  // Set BUILD_FILE based on ARCHITECTURE and PLATFORM
  let BUILD_FILE;
  let ARCH_SUFFIX = "";
  if (PLATFORM === "win32") {
    BUILD_FILE = `${RUNTIME_BUILD_ID}.zip`;
  } else if (ARCHITECTURE === "x86_64") {
    BUILD_FILE = `${RUNTIME_BUILD_ID}.tar.xz`;
  } else if (ARCHITECTURE === "arm64") {
    BUILD_FILE = `${RUNTIME_BUILD_ID}-arm.tar.xz`;
    ARCH_SUFFIX = "-arm";
  } else {
    throw new Error(`Unsupported platform: ${PLATFORM} ${ARCHITECTURE}`);
  }

  const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "buildkite_run_test"));
  process.on("exit", () => fs.rmdirSync(TMP_DIR, { recursive: true }));

  // Download build
  const buildUrl = `https://static.replay.io/downloads/${BUILD_FILE}`;
  console.log(`Downloading build from ${buildUrl}`);
  execSync(`curl ${buildUrl} -o ${path.join(TMP_DIR, BUILD_FILE)}`);

  // Extract build
  fs.mkdirSync(path.join(TMP_DIR, "build"));
  execSync(`tar xf ${path.join(TMP_DIR, BUILD_FILE)} -C ${path.join(TMP_DIR, "build")}`);

  // Download and extract symbols
  // Don't do this for now--we only need this if we're trying to symbolify the chromium output, which
  // we can't easily do (yet).

  // const SYMBOL_FILE = `${RUNTIME_BUILD_ID}${ARCH_SUFFIX}.symbols.tgz`;
  // const symbolUrl = `s3://recordreplay-us-east-2-dev/symbols/${SYMBOL_FILE}`;
  // console.log(`Downloading symbols from ${symbolUrl}`);
  // execSync(`aws s3 cp ${symbolUrl} ${path.join(TMP_DIR, SYMBOL_FILE)}`);
  // fs.mkdirSync(SYMBOLS_DIR, { recursive: true });
  // execSync(`tar xf ${path.join(TMP_DIR, SYMBOL_FILE)} -C ${SYMBOLS_DIR}`);

  // Set Chrome binary path based on OS
  let CHROME_BINARY;
  if (PLATFORM === "linux") {
    CHROME_BINARY = path.join(TMP_DIR, "build", "replay-chromium", "chrome");
  } else if (PLATFORM === "darwin") {
    CHROME_BINARY = path.join(
      TMP_DIR,
      "build",
      "Replay-Chromium.app",
      "Contents",
      "MacOS",
      "Chromium"
    );
  } else if (PLATFORM === "win32") {
    CHROME_BINARY = path.join(TMP_DIR, "build", "replay-chromium", "chrome.exe");
  } else {
    throw new Error(`Unsupported platform: ${PLATFORM}`);
  }
  return CHROME_BINARY;
}

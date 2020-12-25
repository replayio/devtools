/* Copyright 2020 Record Replay Inc. */

const fs = require("fs");
const os = require("os");
const { spawnSync } = require("child_process");

const GeckoInstallDirectories = [
  "/Applications/Replay.app", // macOS
  `${process.env.HOME}/replay`, // linux
];

const GeckoSuffixes = [
  "Contents/MacOS/replay", // macOS
  "replay", // linux, using distribution.
  "dist/bin/replay", // linux, testing with local build.
];

// Get the executable to use when starting gecko.
function findGeckoPath() {
  // Find directories where we should look for gecko.
  let installDirs;
  if (process.env.RECORD_REPLAY_PATH) {
    // A path was explicitly specified via the environment.
    installDirs = [process.env.RECORD_REPLAY_PATH];
  } else {
    // Search the default install directories.
    installDirs = GeckoInstallDirectories;
  }

  for (const dir of installDirs) {
    for (const suffix of GeckoSuffixes) {
      const path = `${dir}/${suffix}`;
      if (fs.existsSync(path)) {
        return path;
      }
    }
  }
  console.error("Can't find Gecko!");
}

function createTestScript({ path }) {
  const generatedScriptPath = tmpFile();
  const generatedScriptFd = fs.openSync(generatedScriptPath, "w");
  spawnSync("clang", ["-C", "-E", "-P", "-nostdinc", "-undef", "-x", "c++", path], {
    stdio: [, generatedScriptFd, generatedScriptFd],
  });
  fs.closeSync(generatedScriptFd);

  // print test file
  if (false) {
    const testFile = fs.readFileSync(generatedScriptPath, { encoding: "utf-8" });
    console.log(testFile);
  }

  return generatedScriptPath;
}

function tmpFile() {
  return os.tmpdir() + "/" + ((Math.random() * 1e9) | 0);
}

module.exports = { findGeckoPath, createTestScript, tmpFile };

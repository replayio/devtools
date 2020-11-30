/* Copyright 2020 Record Replay Inc. */

const fs = require("fs");

const GeckoSuffixes = [
  "Contents/MacOS/replay", // macOS
  "bin/replay", // linux
];

// Get the executable to use when starting gecko.
function findGeckoPath() {
  const installDir = process.env.RECORD_REPLAY_PATH || "/Applications/Replay.app";

  for (const suffix of GeckoSuffixes) {
    const path = `${installDir}/${suffix}`;
    if (fs.existsSync(path)) {
      return path;
    }
  }
  console.error("Can't find Gecko!");
}

module.exports = { findGeckoPath };

/* Copyright 2020 Record Replay Inc. */

const fs = require("fs");
const os = require("os");
const https = require("https");
const { spawnSync } = require("child_process");

const GeckoInstallDirectories = [
  "/Applications/Replay.app", // macOS
  `${process.env.HOME}/replay`, // linux
  "C:\\Program Files\\replay", // windows
];

const GeckoSuffixes = [
  "Contents/MacOS/replay", // macOS
  "Contents/MacOS/firefox", // macOS unbranded
  "replay", // linux, using distribution.
  "firefox", // linux unbranded
  "dist/bin/replay", // linux, testing with local build.
  "dist/bin/firefox", // linux local unbranded
  "replay.exe", // windows
];

// Get the executable to use when starting gecko.
function findGeckoPath() {
  // Find directories where we should look for gecko.
  const installDirs = [...GeckoInstallDirectories];
  if (process.env.RECORD_REPLAY_PATH) {
    // A path was explicitly specified via the environment.
    installDirs.unshift(process.env.RECORD_REPLAY_PATH);
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
  for (const dir of installDirs) {
    try {
      console.log(`Install directory ${dir} contents: ${fs.readdirSync(dir)}`);
    } catch (e) {
      console.log(`Install directory ${dir} error: ${e}`);
    }
  }
  throw new Error("Can't find Gecko!");
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

function spawnChecked(...args) {
  const rv = spawnSync.apply(this, args);
  if (rv.status != 0 || rv.error) {
    throw new Error("Spawned process failed");
  }
}

function defer() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function sendTelemetryEvent(telemetryEvent, tags) {
  if (!process.env.INPUT_GITHUB_CI) {
    return;
  }

  const options = {
    hostname: "telemetry.replay.io",
    por: 443,
    path: "/",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    const request = https.request(options, () => {});
    request.on("error", e => {
      log(`Error sending telemetry ping: ${e}`);
    });
    request.write(JSON.stringify({ event: telemetryEvent, ...tags }));
    request.end();
  } catch (e) {
    console.error(`Couldn't send telemetry event ${telemetryEvent}`, e);
  }
}

module.exports = {
  findGeckoPath,
  createTestScript,
  tmpFile,
  sendTelemetryEvent,
  spawnChecked,
  defer,
};

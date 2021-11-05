const fs = require("fs");
const { spawnSync, spawn } = require("child_process");

function spawnChecked(...args) {
  console.log(`spawn`, args);
  const rv = spawnSync.apply(this, args);
  if (rv.status != 0 || rv.error) {
    throw new Error("Spawned process failed");
  }
}

function checkForFile(path) {
  if (!fs.existsSync(path)) {
    throw new Error(`Required file/directory does not exist: ${path}`);
  }
}

checkForFile("dist/dist.tgz");
checkForFile("replay/replay.dmg");
checkForFile("replay-node/macOS-replay-node");
checkForFile("replay-driver/macOS-recordreplay.so");

console.log(new Date(), "Start");

spawnChecked("mv", ["dist/dist.tgz", "dist.tgz"]);
spawnChecked("tar", ["-xzf", "dist.tgz"]);

console.log(new Date(), "Unpackaged distribution");

spawnChecked("hdiutil", ["attach", "replay/replay.dmg"]);
spawnChecked("cp", ["-R", "/Volumes/Replay/Replay.app", "/Applications"]);
try {
  spawnChecked("hdiutil", ["detach", "/Volumes/Replay/"]);
} catch (e) {}

console.log(new Date(), "Installed replay browser");

spawnChecked("chmod", ["+x", "replay-node/macOS-replay-node"]);

// Set environment variables needed to replay node recordings.
process.env.RECORD_REPLAY_NODE = "replay-node/macOS-replay-node";
process.env.RECORD_REPLAY_DRIVER = "replay-driver/macOS-recordreplay.so";

const devServerProcess = spawn("node_modules/.bin/serve", ["-p", "8080"], {
  detached: true,
  stdio: ["inherit", "pipe", "inherit"],
});

(async function () {
  console.log("Waiting for Webpack server start");
  await Promise.race([
    new Promise(r => {
      devServerProcess.stdout.on("data", chunk => {
        process.stdout.write(chunk);
        // Once the dev server starts outputting stuff, we assume it has started
        // its server and it is safe to curl.
        r();
      });
    }),
    new Promise(r => setTimeout(r, 10 * 1000)).then(() => {
      throw new Error("Failed to start dev server");
    }),
  ]);
  console.log("Waiting for Webpack build");

  // Wait for the initial Webpack build to complete before
  // trying to run the tests so the tests don't run
  // the risk of timing out if the build itself is slow.
  spawnChecked(
    "curl",
    ["--max-time", "600", "--range", "0-50", "http://localhost:8080/dist/main.js"],
    {
      stdio: "inherit",
    }
  );
  console.log("Done Initial Webpack build");

  require("../../../test/run");
})().catch(err => {
  console.error(err);
  process.exit(1);
});

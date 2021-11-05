const fs = require("fs");
const { spawnSync, spawn } = require("child_process");
const core = require("@actions/core");

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

const TEST_SERVER = core.getInput("server");

checkForFile("replay/replay.dmg");
checkForFile("replay-node/macOS-replay-node");
checkForFile("replay-driver/macOS-recordreplay.so");

console.log(new Date(), "Start");
console.log("Using server url:", TEST_SERVER);

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

(async function () {
  spawnChecked("node", ["../../../test/run", "--testServer", TEST_SERVER], {
    stdio: "inherit",
  });
})().catch(err => {
  console.error(err);
  process.exit(1);
});

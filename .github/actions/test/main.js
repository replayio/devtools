const fs = require("fs");
const { spawnSync } = require("child_process");

function spawnChecked(...args) {
  console.log(`Spawning`, args);
  const rv = spawnSync.apply(this, args);
  if (rv.status != 0 || rv.error) {
    throw new Error("Spawned process failed");
  }
  console.log(`Spawned`, args);
}

function checkForFile(path) {
  console.log(`Checking for file: ${path}`);
  if (!fs.existsSync(path)) {
    throw new Error(`Required file/directory does not exist: ${path}`);
  }
  console.log(`Found ${path}`);
}

checkForFile("replay/replay.dmg");
checkForFile("replay-node/macOS-replay-node");
checkForFile("replay-driver/macOS-recordreplay.so");

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
  spawnChecked("curl", ["--max-time", "180", "--range", "0-50", "http://localhost:8080/"], {
    stdio: "inherit",
  });
  console.log("Made contact with server on localhost:8080");

  require("../../../test/run");
})().catch(err => {
  console.error(err);
  process.exit(1);
});

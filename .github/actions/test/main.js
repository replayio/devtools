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
checkForFile("replay/node");
checkForFile("replay/macOS-recordreplay.so");

console.log(new Date(), "Start");

spawnChecked("mv", ["dist/dist.tgz", "dist.tgz"]);
spawnChecked("tar", ["-xzf", "dist.tgz"]);

console.log(new Date(), "Unpackaged distribution");

spawnChecked("hdiutil", ["attach", "replay/replay.dmg"]);
spawnChecked("cp", ["-R", "/Volumes/Replay/Replay.app", "/Applications"]);
spawnChecked("hdiutil", ["detach", "/Volumes/Replay/"]);

console.log(new Date(), "Installed replay browser");

// Set environment variables needed to replay node recordings.
process.env.RECORD_REPLAY_NODE = "replay/node";
process.env.RECORD_REPLAY_DRIVER = "replay/macOS-recordreplay.so";

spawnChecked("ls", {
  cwd: "..",
  stdio: "inherit",
});

spawn("node_modules/.bin/webpack-dev-server", {
  detached: true,
  stdio: "inherit",
});

require("../../../test/run");

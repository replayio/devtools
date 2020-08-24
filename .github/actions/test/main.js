const { spawnSync } = require("child_process");

function spawnChecked(...args) {
  const rv = spawnSync.apply(this, args);
  if (rv.status != 0 || rv.error) {
    throw new Error("Spawned process failed");
  }
}

spawnChecked("wget", ["https://replay.io/downloads/replay.dmg"]);
console.log("Fetched replay.dmg");

spawnChecked("hdiutil", ["attach", "replay.dmg"]);
spawnChecked("cp", ["-R", "/Volumes/Replay/Replay.app", "/Applications"]);
spawnChecked("hdiutil", ["detach", "/Volumes/Replay/"]);
console.log("Installed replay browser");

spawnChecked("npm", ["install"]);
console.log("Installed dependencies");

spawnChecked("./node_modules/.bin/webpack", ["--mode", "development"]);
console.log("Built webpack");

require("../../../test/run");

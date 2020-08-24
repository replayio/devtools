const { spawnSync } = require("child_process");

function spawnChecked(...args) {
  const rv = spawnSync.apply(this, args);
  if (rv.status != 0 || rv.error) {
    throw new Error("Spawned process failed");
  }
}

spawnChecked("mv", ["dist/dist.tgz", "dist.tgz"]);
spawnChecked("tar", ["-xzf", "dist.tgz"]);
console.log("Unpackaged distribution");

spawnChecked("hdiutil", ["attach", "replay/replay.dmg"]);
spawnChecked("cp", ["-R", "/Volumes/Replay/Replay.app", "/Applications"]);
spawnChecked("hdiutil", ["detach", "/Volumes/Replay/"]);
console.log("Installed replay browser");

require("../../../test/run");

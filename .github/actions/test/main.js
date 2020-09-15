const { spawnSync, spawn } = require("child_process");

function spawnChecked(...args) {
  console.log(`spawn`, args);
  const rv = spawnSync.apply(this, args);
  if (rv.status != 0 || rv.error) {
    throw new Error("Spawned process failed");
  }
}

console.log(new Date(), "Start");

spawnChecked("mv", ["dist/dist.tgz", "dist.tgz"]);
spawnChecked("tar", ["-xzf", "dist.tgz"]);

console.log(new Date(), "Unpackaged distribution");

spawnChecked("hdiutil", ["attach", "replay/replay.dmg"]);
spawnChecked("cp", ["-R", "/Volumes/Replay/Replay.app", "/Applications"]);
spawnChecked("hdiutil", ["detach", "/Volumes/Replay/"]);

console.log(new Date(), "Installed replay browser");

spawnChecked("ls", {
  cwd: "..",
  stdio: "inherit",
});

spawn("node_modules/.bin/webpack-dev-server", {
  detached: true,
  stdio: "inherit",
});

require("../../../test/run")({_: ["record-all"]});

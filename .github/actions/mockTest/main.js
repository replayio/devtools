const fs = require("fs");
const { spawnSync, spawn } = require("child_process");

const devtools = `${__dirname}/../../..`;

console.log(new Date(), "Start");

(async function () {
  spawnChecked(
    "curl",
    ["--max-time", "180", "--range", "0-50", "http://localhost:8080/test/harness.js"],
    {
      stdio: "inherit",
    }
  );

  spawnChecked("node", [`${devtools}/test/mock/run`], { stdio: "inherit" });
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});

function spawnChecked(...args) {
  console.log(`spawn`, args);
  const rv = spawnSync.apply(this, args);
  if (rv.status != 0 || rv.error) {
    throw new Error("Spawned process failed");
  }
}

function spawnCheckedRetry(...args) {
  for (let i = 0; i < 5; i++) {
    try {
      spawnChecked(...args);
      return;
    } catch (e) {
      console.error("Spawned process failed");
    }
  }
  throw new Error("Spawned process failed repeatedly, giving up.");
}

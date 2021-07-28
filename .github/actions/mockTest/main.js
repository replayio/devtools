const fs = require("fs");
const { spawnSync, spawn } = require("child_process");

const devtools = `${__dirname}/../../..`;

console.log(new Date(), "Start");

spawnCheckedRetry("npm", ["install"], { cwd: devtools, stdio: "inherit" });
const devServerProcess = spawn("node_modules/.bin/webpack", ["serve"], {
  cwd: devtools,
  stdio: ["inherit", "pipe", "inherit"],
});

console.log(new Date(), "Installed devtools and started webpack build");

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

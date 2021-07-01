const { execFileSync } = require("child_process");

const GIT_SHA = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();

execFileSync("./node_modules/.bin/webpack", [], {
  env: {
    NODE_ENV: "production",
    REPLAY_RELEASE: GIT_SHA,
    REPLAY_BUILD_VISUALIZE: "1",
  },
  stdio: "inherit",
});

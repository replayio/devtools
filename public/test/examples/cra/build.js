const os = require("os");
const path = require("path");
const fse = require("fs-extra");
const { spawnSync } = require("child_process");

const APP_NAME = "cra-e2e-test-app";

const buildDir = fse.mkdtempSync(path.join(os.tmpdir(), "devtools-cra-e2e-test-"));
const distDir = path.join(__dirname, "dist");

spawnSync("npm", ["init", "react-app", APP_NAME], {
  cwd: buildDir,
  stdio: "inherit",
});
fse.copySync(path.join(__dirname, "src/App.js"), path.join(buildDir, APP_NAME, "src/App.js"));

spawnSync("npm", ["run", "build"], {
  cwd: path.join(buildDir, APP_NAME),
  env: {
    ...process.env,
    PUBLIC_URL: ".",
  },
  stdio: "inherit",
});

fse.emptyDirSync(distDir);
fse.copySync(path.join(buildDir, APP_NAME, "build"), distDir);

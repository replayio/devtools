const os = require("os");
const path = require("path");
const fse = require("fs-extra");
const fs = require('fs');
const { spawnSync } = require("child_process");

const APP_NAME = "redux-e2e-test-app";

const buildDir = fse.mkdtempSync(path.join(os.tmpdir(), "devtools-redux-e2e-test-"));
const distDir = path.join(__dirname, "dist");
const appDir = path.join(buildDir, APP_NAME);

spawnSync("npm", ["init", "vite", "--", APP_NAME, "--template", "vanilla"], {
  cwd: buildDir,
  stdio: "inherit",
});
spawnSync("npm", ["install", "@reduxjs/toolkit"], {
  cwd: appDir,
  stdio: "inherit",
})
fse.copySync(path.join(__dirname, "src/main.js"), path.join(appDir, "main.js"));
fse.copySync(path.join(__dirname, "vite.config.js"), path.join(appDir, "vite.config.js"));

spawnSync("npm", ["run", "build"], {
  cwd: appDir,
  env: process.env,
  stdio: "inherit",
});

fse.emptyDirSync(distDir);
fse.copySync(path.join(buildDir, APP_NAME, "dist"), distDir);

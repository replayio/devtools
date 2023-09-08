const path = require("path");
const fse = require("fs-extra");
const { spawnSync } = require("child_process");

const currentFolder = __dirname;
const repoRoot = path.join(currentFolder, "../../../../");
const publicExamplesFolder = path.normalize(path.join(repoRoot, "public/test/examples"));
const buildFolder = path.join(currentFolder, "build");
const staticJsFolder = path.join(buildFolder, "static/js");

const craExampleDist = path.join(publicExamplesFolder, "cra/dist");

console.log("Copying build output to: ", craExampleDist);

// We need two copies of the index file to support making
// golden recordings with both FF and Chromium, as our tests
// use the HTML filename as the recording lookup key.
fse.copyFileSync(
  path.join(buildFolder, "index.html"),
  path.join(buildFolder, "index_chromium.html")
);

fse.emptyDirSync(craExampleDist);
fse.copySync(buildFolder, craExampleDist);

console.log("Uploading sourcemaps...");

spawnSync(
  "yarn",
  [
    "replay-sourcemap-upload",
    "--group",
    "e2e-test",
    "--key",
    "rwk_7XPbO5fhz0bkhANYXtN2dkm74wNQCchXf2OxVgAerTQ",
    staticJsFolder,
  ],
  { stdio: "inherit", cwd: currentFolder }
);

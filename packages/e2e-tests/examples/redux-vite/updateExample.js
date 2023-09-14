const path = require("path");
const fse = require("fs-extra");
const { spawnSync } = require("child_process");

const currentFolder = __dirname;
const repoRoot = path.join(currentFolder, "../../../../");
const publicExamplesFolder = path.normalize(path.join(repoRoot, "public/test/examples"));
const buildFolder = path.join(currentFolder, "dist");
const staticJsFolder = path.join(buildFolder, "assets");

const exampleDist = path.join(publicExamplesFolder, "redux/dist");

console.log("Copying build output to: ", exampleDist);

fse.mkdirpSync(exampleDist);
fse.emptyDirSync(exampleDist);
fse.copySync(buildFolder, exampleDist);

console.log("Uploading sourcemaps...");

spawnSync(
  "yarn",
  [
    "replay",
    "upload-sourcemaps",
    //"--dry-run",
    "--group",
    "e2e-test",
    "--api-key",
    "rwk_7XPbO5fhz0bkhANYXtN2dkm74wNQCchXf2OxVgAerTQ",
    staticJsFolder,
  ],
  { stdio: "inherit", cwd: currentFolder }
);

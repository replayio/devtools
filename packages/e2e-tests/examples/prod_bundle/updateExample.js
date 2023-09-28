const path = require("path");
const fse = require("fs-extra");
const { spawnSync } = require("child_process");

const currentFolder = __dirname;
const repoRoot = path.join(currentFolder, "../../../../");
const publicExamplesFolder = path.normalize(path.join(repoRoot, "public/test/examples"));
const staticJsFolder = path.join(currentFolder, "dist");

console.log("Copying build output to: ", publicExamplesFolder);

const artifactFilenames = fse.readdirSync(staticJsFolder);

console.log("Filenames: ", artifactFilenames);

for (const artifactFilename of artifactFilenames) {
  const artifactPath = path.join(staticJsFolder, artifactFilename);
  const outputPath = path.join(publicExamplesFolder, artifactFilename);
  console.log("Copying file: ", {
    from: artifactPath,
    to: outputPath,
  });

  // Lots of files in that folder, so just overwrite these specifically
  fse.copyFileSync(artifactPath, outputPath);
}

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
    "rwk_7o3q05qOwAXoYHWiVLra5cuOilLIghqDRMWyd8ObPac",
    staticJsFolder,
  ],
  { stdio: "inherit", cwd: currentFolder }
);

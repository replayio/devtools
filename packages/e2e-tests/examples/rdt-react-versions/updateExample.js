const path = require("path");
const fse = require("fs-extra");
const { spawnSync } = require("child_process");

const copyToLocalDev = process.argv.includes("dev");

const reactSubVersions = ["15", "16", "17"];

const currentFolder = __dirname;
const repoRoot = path.join(currentFolder, "../../../../");
const publicExamplesFolder = path.normalize(path.join(repoRoot, "public/test/examples"));
const buildFolder = path.join(currentFolder, "dist");
// const staticJsFolder = path.join(buildFolder, "assets");

const localPublicFolder = path.join(currentFolder, "public");

if (copyToLocalDev) {
  fse.emptyDirSync(localPublicFolder);

  for (const version of reactSubVersions) {
    const appDist = path.join(currentFolder, `react-${version}-app`, "dist");
    const targetFolder = path.join(localPublicFolder, `react${version}`);
    fse.mkdirpSync(targetFolder);
    console.log(`Copying React ${version} example to ${targetFolder}`);
    fse.copySync(appDist, targetFolder);
  }
} else {
  const exampleDist = path.join(publicExamplesFolder, "rdt-react-versions/dist");

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
      "--dry-run",
      "--group",
      "e2e-test",
      "--api-key",
      "rwk_7XPbO5fhz0bkhANYXtN2dkm74wNQCchXf2OxVgAerTQ",
      buildFolder,
    ],
    { stdio: "inherit", cwd: currentFolder }
  );
}

const path = require("path");
const fse = require("fs-extra");
const { spawnSync } = require("child_process");
const glob = require("glob");

const remapping = require("@ampproject/remapping");

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
    const reactExampleFolderName = `react-${version}-app`;
    const appDist = path.join(currentFolder, reactExampleFolderName, "dist");
    const targetFolder = path.join(localPublicFolder, `react${version}`);
    fse.mkdirpSync(targetFolder);
    console.log(`Copying React ${version} example to ${targetFolder}`);
    fse.copySync(appDist, targetFolder);

    // Rewrite the sourcemaps to show each example's source files as coming from a different folder,
    // so they don't stomp on each other when the backend processes them.
    const targetAssetPath = path.join(targetFolder, "assets");
    const sourcemapFiles = glob.sync(path.join(targetAssetPath, "*.js.map"), { absolute: true });

    console.log("Rewriting sourcemaps for example: ", reactExampleFolderName);

    for (const sourcemapFile of sourcemapFiles) {
      const parsedSourcemap = JSON.parse(fse.readFileSync(sourcemapFile, "utf8"));
      const remappedSourcemap = remapping(parsedSourcemap, (file, ctx) => {
        if (file.startsWith("../../node_modules") || file.startsWith("../../src")) {
          // Replace the original sourcemapped file path to pretend it was in an example-specific folder
          ctx.source = file.replace("../../", `../../${reactExampleFolderName}/`);
        }
        return null;
      });
      fse.writeFileSync(sourcemapFile, JSON.stringify(remappedSourcemap), "utf8");
    }
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
      // "--dry-run",
      "--group",
      "e2e-test",
      "--api-key",
      "rwk_7o3q05qOwAXoYHWiVLra5cuOilLIghqDRMWyd8ObPac",
      buildFolder,
    ],
    { stdio: "inherit", cwd: currentFolder }
  );
}

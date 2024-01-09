import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { find as findInFiles } from "find-in-files";

const examplesJsonPath = join(__dirname, "..", "examples.json");

/**
 * Grab all golden recordings that have been recorded on chromium before.
 */
function getChromiumHtmlFiles() {
  const text = "" + readFileSync(examplesJsonPath);
  const res = JSON.parse(text) as { [fileName: string]: { recording: string; buildId: string } };
  return Object.entries(res)
    .filter(([fileName, { buildId }]) => fileName.endsWith(".html") && buildId.includes("chromium"))
    .map(([fileName]) => fileName);
}

/**
 * Use heuristics to find all tests that use the given htmlFiles.
 */
async function getTestNamesWhichUse(htmlFiles: string[]) {
  const searchTerm = "(" + htmlFiles.join(")|(") + ")";
  const results = await findInFiles(searchTerm, join(__dirname, ".."), "test\.ts");
  // NOTE: results is an array that was forced to look like an object.
  const testNames = Object.keys(results);
  return testNames;
}

(async () => {
  // Find all files.
  const htmlFiles = getChromiumHtmlFiles();
  console.log("Re-recording golden recordings:\n ", htmlFiles.join("\n "));

  // Re-record golden recordings.
  execSync(
    `xvfb-run ./packages/e2e-tests/scripts/save-examples.ts --runtime=chromium --project=replay-chromium-local --example=${htmlFiles.join(
      ","
    )}`,
    { stdio: "inherit", env: process.env }
  );
  
  // Without the wait, the next xvfb-run command can fail.
  execSync("sleep 5");

  // Run tests.
  const testNames = await getTestNamesWhichUse(htmlFiles);
  console.log("Running tests:\n  ", testNames.join("\n "));
  execSync(`xvfb-run yarn test:debug_local ${testNames.join(" \n")}`, {
    stdio: "inherit",
    env: process.env,
  });
})();

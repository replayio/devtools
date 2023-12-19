import fs from "fs";
import path from "path";
import glob from "glob";
import CoverageReport from "monocart-coverage-reports";
import { merge } from "monocart-reporter";

(async () => {
  try {
    // We'll pass this in from the outside
    const inputFolderPath: string = process.argv[2];

    if (!inputFolderPath) {
      throw new Error("Missing input folder path");
    }

    const outputFolder = path.join(inputFolderPath, "coverage-reports");
    if (fs.existsSync(outputFolder)) {
      fs.rmdirSync(outputFolder, { recursive: true });
    }

    const pattern = path.posix.join(inputFolderPath, "**/monocart*.json");
    console.log("Input path: ", inputFolderPath, "pattern: ", pattern);
    const reportJsonFiles = glob.sync(pattern, { absolute: true });

    const pattern2 = path.posix.join(inputFolderPath, "**/coverage-report.json");

    const coverageJsonFiles = glob.sync(pattern2, { absolute: true });

    console.log("Report files: ", reportJsonFiles);
    console.log("Coverage files: ", coverageJsonFiles);
    await merge(reportJsonFiles, {
      name: "My Merged Report",
      outputFile: "./test-results/merged-report.html",
      coverage: {
        outputFile: "./test-results/merged-coverage.html",
        entryFilter: entry => {
          console.log("Entry: ", entry.url);
          const ignoreUrls = ["cdn", "webreplay", "devtools-"];
          for (const ignoreUrl of ignoreUrls) {
            if (entry.url.includes(ignoreUrl)) {
              return false;
            }
          }
          return true;
        },
        sourceFilter: (sourcePath: string) => {
          const regex = /(src|replay-next|packages|pages)\/.+\.(t|j)sx?/gm;

          //return sourcePath.search(/src|replay-next\/.+/) !== -1;
          const matches = regex.test(sourcePath);
          const isNodeModules = sourcePath.includes("node_modules");
          console.log("Source: ", sourcePath, matches);
          return matches && !isNodeModules;
        },
        onEnd: async reportData => {
          console.log("Finished merging coverage report", reportData.summary);
        },
      },

      attachmentPath: (currentPath, extras) => {
        console.log("Current attachment path: ", currentPath);
        // return "./attachments";
        return currentPath;
        // return `https://cenfun.github.io/monocart-reporter/${currentPath}`;
      },
      onEnd: async (reportData: any, capability: any) => {
        console.log("Finished merging report", reportData.summary);
        console.log("All report data: ", reportData);
      },
    });

    const coverageReport = new CoverageReport({
      outputDir: "./test-results/coverage-reports",
      logging: "debug",
      entryFilter: entry => {
        const ignoreUrls = ["cdn", "webreplay", "devtools-"];
        for (const ignoreUrl of ignoreUrls) {
          if (entry.url.includes(ignoreUrl)) {
            return false;
          }
        }
        return true;
      },
      reports: [["html"]],
    });
    const coverageJsonContents = coverageJsonFiles.map(
      f => JSON.parse(fs.readFileSync(f, "utf-8")) as any
    );
    for (const coverageJson of coverageJsonContents) {
      console.log("Files length: ", coverageJson.files.length);
    }
    const allCoverageFiles = coverageJsonContents.flatMap(c => c.files);
    console.log("All coverage files length: ", allCoverageFiles.length);
    for (const item of allCoverageFiles) {
      item.text = item.source;
    }
    await coverageReport.add(allCoverageFiles);
    // for (const coverageJsonFile of coverageJsonFiles) {
    //   const coverageJson = JSON.parse(fs.readFileSync(coverageJsonFile, "utf-8"));
    //   // console.log(
    //   //   "Files: ",
    //   //   coverageJson.files.map(f => ({ url: f.url, ranges: f.ranges }))
    //   // );
    //   // console.log("Coverage JSON: ", coverageJson);
    //   await coverageReport.add(coverageJson.files);
    // }

    const coverageResults = await coverageReport.generate();
    console.log(coverageResults);

    process.exit(0);
  } catch (error) {
    console.error("Unexpected error: ", error);

    process.exit(1);
  }
})();

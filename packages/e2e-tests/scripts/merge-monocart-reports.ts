import fs from "fs";
import path from "path";
import glob from "glob";
import CoverageReport from "monocart-coverage-reports";
import { merge } from "monocart-reporter";

const currentFolder = __dirname;
const rootFolder = path.posix.join(currentFolder, "../../..");

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

    const pattern2 = path.posix.join(inputFolderPath, "**/istanbul-coverage-report.json");

    const coverageJsonFiles = glob.sync(pattern2, { absolute: true });

    console.log("Report files: ", reportJsonFiles);
    console.log("Coverage files: ", coverageJsonFiles);
    // await merge(reportJsonFiles, {
    //   name: "My Merged Report",
    //   outputFile: "./test-results/merged-report.html",
    //   coverage: {
    //     outputFile: "./test-results/merged-coverage.html",
    //     entryFilter: entry => {
    //       console.log("Entry: ", entry.url);
    //       const ignoreUrls = ["cdn", "webreplay", "devtools-"];
    //       for (const ignoreUrl of ignoreUrls) {
    //         if (entry.url.includes(ignoreUrl)) {
    //           return false;
    //         }
    //       }
    //       return true;
    //     },
    //     sourceFilter: (sourcePath: string) => {
    //       const regex = /(src|replay-next|packages|pages)\/.+\.(t|j)sx?/gm;

    //       //return sourcePath.search(/src|replay-next\/.+/) !== -1;
    //       const matches = regex.test(sourcePath);
    //       const isNodeModules = sourcePath.includes("node_modules");
    //       console.log("Source: ", sourcePath, matches);
    //       return matches && !isNodeModules;
    //     },
    //     onEnd: async reportData => {
    //       console.log("Finished merging coverage report", reportData.summary);
    //     },
    //   },

    //   attachmentPath: (currentPath, extras) => {
    //     console.log("Current attachment path: ", currentPath);
    //     // return "./attachments";
    //     return currentPath;
    //     // return `https://cenfun.github.io/monocart-reporter/${currentPath}`;
    //   },
    //   onEnd: async (reportData: any, capability: any) => {
    //     console.log("Finished merging report", reportData.summary);
    //     console.log("All report data: ", reportData);
    //   },
    // });

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
      sourcePath: (currentPath: string) => {
        // console.log("Source path: ", currentPath);

        const reJustFilename = /(_N_E\/)?(?<filename>.+)\/(\d|\w){4}/;
        const match = reJustFilename.exec(currentPath);

        if (match) {
          const filename: string = match.groups?.filename || "";
          return filename;
          // const pathWithoutNE = currentPath.replace("_N_E/", "");
          // const revisedPath = path.posix.join(rootFolder, filename);
          // console.log("Revised path: ", revisedPath, fs.existsSync(revisedPath));
          // return revisedPath;
        } else {
          console.log("No match: ", currentPath);
        }
        //  const pathWithoutNE
        // const pathWithoutNE = currentPath.replace("_N_E/", "");
        // const revisedPath = path.posix.join(rootFolder, pathWithoutNE);
        // console.log("Revised path: ", revisedPath, fs.existsSync(revisedPath));
        return currentPath;
        // console.log("Source path: ", currentPath);
        // return currentPath;
      },

      // @ts-ignore
      sourceFinder: (sourcePath: string) => {
        console.log("Source finder: ", sourcePath);
        const revisedPath = path.posix.join(rootFolder, sourcePath);

        return fs.readFileSync(revisedPath, "utf8");
      },

      reports: [["html"]],
    });
    const coverageJsonContents = coverageJsonFiles.map(
      f => JSON.parse(fs.readFileSync(f, "utf-8")) as any
    );
    for (const coverageJson of coverageJsonContents) {
      await coverageReport.add(coverageJson);
      // console.log("Files length: ", coverageJson.files.length);
    }
    // const allCoverageFiles = coverageJsonContents.flatMap(c => c.files);
    // console.log("All coverage files length: ", allCoverageFiles.length);
    // for (const item of allCoverageFiles) {
    //   item.text = item.source;
    // }
    // await coverageReport.add(allCoverageFiles);
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

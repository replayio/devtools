import fs from "fs";
import path from "path";
import glob from "glob";
import { merge } from "monocart-reporter";

// We'll pass this in from the outside
const inputFolderPath: string = process.argv[2];

if (!inputFolderPath) {
  throw new Error("Missing input folder path");
}

const pattern = path.posix.join(inputFolderPath, "**/*.json");
console.log("Input path: ", inputFolderPath, "pattern: ", pattern);
const reportJsonFiles = glob.sync(pattern, { absolute: true });

console.log("Report files: ", reportJsonFiles);

(async () => {
  try {
    await merge(reportJsonFiles, {
      name: "My Merged Report",
      outputFile: "./test-results/merged-report.html",
      coverage: {
        outputFile: "./test-results/merged-coverage.html",
        entryFilter: () => true,
        sourceFilter: (sourcePath: string) => sourcePath.search(/src|replay-next\/.+/) !== -1,
        onEnd: async reportData => {
          console.log("Finished merging coverage report", reportData.summary);
        },
      },
      attachmentPath: (currentPath, extras) => {
        console.log("Current attachment path: ", currentPath);
        return "./attachments";
        // return `https://cenfun.github.io/monocart-reporter/${currentPath}`;
      },
      onEnd: async (reportData: any, capability: any) => {
        console.log("Finished merging report", reportData.summary);
        console.log("All report data: ", reportData);
      },
    });

    process.exit(0);
  } catch (error) {
    console.error("Unexpected error: ", error);

    process.exit(1);
  }
})();

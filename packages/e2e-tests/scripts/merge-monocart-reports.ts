import fs from "fs";
import path from "path";
import glob from "glob";
import CoverageReport from "monocart-coverage-reports";

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

    const pattern2 = path.posix.join(inputFolderPath, "**/istanbul-coverage-report.json");

    const coverageJsonFiles = glob.sync(pattern2, { absolute: true });

    const coverageReport = new CoverageReport({
      outputDir: "./test-results/coverage-reports",
      logging: "debug",

      sourcePath: (currentPath: string) => {
        // Webpack files end up with a "_N_E/" prefix,
        // and sometimes there's also a 4-char hex code at the end.
        // Strip that out to just the filename.
        const reJustFilename = /(_N_E\/)?(?<filename>.+)(\/(\d|\w){4})?/;
        const match = reJustFilename.exec(currentPath);

        if (match) {
          const filename: string = match.groups?.filename || "";
          return filename;
        } else {
          console.log("No match: ", currentPath);
        }

        return currentPath;
      },

      // This option gets passed through to the underlying `istanbul-lib-coverage`
      // package, and `monocart-coverage-reporter` doesn't include it in its types.

      // @ts-ignore
      sourceFinder: (sourcePath: string) => {
        const revisedPath = path.posix.join(rootFolder, sourcePath);

        if (fs.existsSync(revisedPath)) {
          if (fs.statSync(revisedPath).isDirectory()) {
            // Can't load source content for a directory
            return;
          }

          return fs.readFileSync(revisedPath, "utf8");
        }
      },

      onEnd: async (reportData: any) => {
        console.log("Coverage generated: ", reportData.summary);
        const shortSha = process.env.GITHUB_SHA?.substring(0, 7) ?? "(unknown)";

        // TODO Eventually include the uploaded artifact URL:
        // https://github.com/actions/upload-artifact/issues/50#issuecomment-1856471599

        fs.writeFileSync(
          "coverageSummary.md",
          `
### Coverage Summary (statements)

- Commit: ${shortSha}

\`\`\`json
${JSON.stringify(reportData.summary.statements, null, 2)}
\`\`\`


`
        );
      },

      reports: [["html"]],
    });

    // Add each sharded coverage report
    const coverageJsonContents = coverageJsonFiles.map(
      f => JSON.parse(fs.readFileSync(f, "utf-8")) as any
    );

    for (const coverageJson of coverageJsonContents) {
      await coverageReport.add(coverageJson);
    }

    const coverageResults = await coverageReport.generate();
    console.log("Coverage: ", Object.keys(coverageResults));

    process.exit(0);
  } catch (error) {
    console.error("Unexpected error: ", error);

    process.exit(1);
  }
})();

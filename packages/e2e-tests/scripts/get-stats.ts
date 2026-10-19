import { lstatSync, readFileSync, readdirSync } from "fs";
import { join, relative } from "path";

type Examples = typeof import("../examples.json");

/**
 * Note: typeof does not include optional props, so we need to
 * cast to this instead.
 */
type AllExampleProps = {
  recording: string;
  buildId: string;
  playwrightScript?: string;
  requiresManualUpdate?: boolean;
};
type Stats = {
  [buildId: string]: {
    numRecordings: number;
    numTests: number;
  };
};

const baseDir = join(__dirname, "..");
const exampleJSON = JSON.parse(readFileSync(join(baseDir, "examples.json"), "utf8")) as Examples;
const basePaths = [join(baseDir, "authenticated"), join(baseDir, "tests")];

export type ExampleInfo = {
  runtime: string;
  runtimeReleaseDate: Date;
  runtimeOS: string;
  recordingId: string;
  exampleName: string;
  requiresManualUpdate: boolean;
};

export function getStats() {
  const exampleToTestMap: { [example: string]: string[] } = {};
  const stats: Stats = {};
  const testFileList: string[] = [];
  const testFileToInfoMap: { [testFile: string]: ExampleInfo } = {};

  function crawl(directoryPath: string) {
    readdirSync(directoryPath).forEach((entry: string) => {
      if (entry === "." || entry === "..") {
        return;
      }

      const entryPath = join(directoryPath, entry);
      const stat = lstatSync(entryPath);
      if (stat.isDirectory()) {
        crawl(entryPath);
      } else {
        testFileList.push(entryPath);
      }
    });
  }

  basePaths.forEach(crawl);

  for (let exampleName in exampleJSON) {
    const { buildId, recording, requiresManualUpdate } = exampleJSON[
      exampleName as keyof Examples
    ] as AllExampleProps;

    if (stats[buildId] == null) {
      stats[buildId] = {
        numRecordings: 0,
        numTests: 0,
      };
    }

    stats[buildId].numRecordings++;

    testFileList.forEach(filePath => {
      const text = readFileSync(filePath, "utf8");
      if (text.includes(exampleName)) {
        stats[buildId].numTests++;

        if (exampleToTestMap[exampleName] == null) {
          exampleToTestMap[exampleName] = [];
        }

        const relativeFilePath = relative(baseDir, filePath);

        exampleToTestMap[exampleName].push(relativeFilePath);

        const [os, runtime, releaseDate] = buildId.split("-");

        testFileToInfoMap[relativeFilePath] = {
          exampleName,
          runtime,
          runtimeReleaseDate: new Date(
            `${releaseDate.substring(0, 4)}-${releaseDate.substring(4, 6)}-${releaseDate.substring(
              6
            )} 00:00:00`
          ),
          runtimeOS: os,
          recordingId: recording,
          requiresManualUpdate: !!requiresManualUpdate,
        };
      }
    });
  }

  const browserSummaryStats: Stats = {};
  const osSummaryStats: Stats = {};
  const releaseYearStats: Stats = {};
  const sortedStats: Stats = {};

  Object.keys(stats)
    .sort()
    .forEach(buildId => {
      const { numRecordings, numTests } = stats[buildId];

      sortedStats[buildId] = {
        numRecordings,
        numTests,
      };

      const [os, browser, date] = buildId.split("-");

      const year = date.substring(0, 4);

      if (browserSummaryStats[browser] == null) {
        browserSummaryStats[browser] = {
          numRecordings: 0,
          numTests: 0,
        };
      }
      browserSummaryStats[browser].numRecordings += numRecordings;
      browserSummaryStats[browser].numTests += numTests;

      if (osSummaryStats[os] == null) {
        osSummaryStats[os] = {
          numRecordings: 0,
          numTests: 0,
        };
      }
      osSummaryStats[os].numRecordings += numRecordings;
      osSummaryStats[os].numTests += numTests;

      if (releaseYearStats[year] == null) {
        releaseYearStats[year] = {
          numRecordings: 0,
          numTests: 0,
        };
      }
      releaseYearStats[year].numRecordings += numRecordings;
      releaseYearStats[year].numTests += numTests;
    });

  const entries = Object.entries(testFileToInfoMap).sort((a, b) => {
    const aValue = a[1];
    const bValue = b[1];

    if (aValue.runtimeReleaseDate.getTime() !== bValue.runtimeReleaseDate.getTime()) {
      return aValue.runtimeReleaseDate.getTime() - bValue.runtimeReleaseDate.getTime();
    } else if (aValue.runtimeOS !== bValue.runtimeOS) {
      return aValue.runtimeOS.localeCompare(bValue.runtimeOS);
    } else if (aValue.runtime !== bValue.runtime) {
      return aValue.runtime.localeCompare(bValue.runtime);
    } else {
      return a[0].localeCompare(b[0]);
    }
  });

  return {
    browserSummaryStats,
    exampleToTestMap,
    osSummaryStats,
    releaseYearStats,
    sortedStats,
    testFileList,
    testFileToInfoMap: Object.fromEntries(entries),
  };
}

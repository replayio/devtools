import { lstatSync, readFileSync, readdirSync } from "fs";
import { join, relative } from "path";

type Examples = typeof import("../examples.json");
type Stats = {
  [buildId: string]: {
    numRecordings: number;
    numTests: number;
  };
};

const baseDir = join(__dirname, "..");
const exampleJSON = JSON.parse(readFileSync(join(baseDir, "examples.json"), "utf8")) as Examples;
const basePaths = [join(baseDir, "authenticated"), join(baseDir, "tests")];

export function getStats() {
  const exampleToTestMap: { [example: string]: string[] } = {};
  const stats: Stats = {};
  const testFileList: string[] = [];

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

  for (let key in exampleJSON) {
    const { buildId } = exampleJSON[key as keyof Examples];

    if (stats[buildId] == null) {
      stats[buildId] = {
        numRecordings: 0,
        numTests: 0,
      };
    }

    stats[buildId].numRecordings++;

    testFileList.forEach(filePath => {
      const text = readFileSync(filePath, "utf8");
      if (text.includes(key)) {
        stats[buildId].numTests++;

        if (exampleToTestMap[key] == null) {
          exampleToTestMap[key] = [];
        }

        exampleToTestMap[key].push(relative(baseDir, filePath));
      }
    });
  }

  const browserSummaryStats: Stats = {};
  const osSummaryStats: Stats = {};
  const releaseYearStats: Stats = {};
  const sortedStats: Stats = {};

  Object.keys(stats)
    .sort()
    .forEach(key => {
      const { numRecordings, numTests } = stats[key];

      sortedStats[key] = {
        numRecordings,
        numTests,
      };

      const [os, browser, date] = key.split("-");

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

  return {
    browserSummaryStats,
    exampleToTestMap,
    osSummaryStats,
    releaseYearStats,
    sortedStats,
    testFileList,
  };
}

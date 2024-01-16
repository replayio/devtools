const { extname, lstatSync, readdirSync, readFileSync } = require("fs");
const { join } = require("path");

type Examples = typeof import("./examples.json");
type Example = Examples[keyof Examples];
type Stats = {
  [buildId: string]: {
    numRecordings: number;
    numTests: number;
  };
};

const exampleJSON = JSON.parse(readFileSync(join(__dirname, "examples.json"), "utf8")) as Examples;

const basePaths = [join(__dirname, "authenticated"), join(__dirname, "tests")];

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

const stats: Stats = {};

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

console.log(`Searched ${testFileList.length} tests`);
console.table(sortedStats);
console.table(browserSummaryStats);
console.table(osSummaryStats);
console.table(releaseYearStats);

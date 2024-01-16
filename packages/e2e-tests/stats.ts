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

const sortedStats = Object.keys(stats)
  .sort()
  .reduce((sorted: Stats, key) => {
    sorted[key] = stats[key as keyof typeof stats];
    return sorted;
  }, {} as Stats);

console.log(`Searched ${testFileList.length} files.`);
console.table(sortedStats);

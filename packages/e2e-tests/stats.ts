const { extname, lstatSync, readdirSync, readFileSync } = require("fs");
const { join } = require("path");

type Examples = typeof import("./examples.json");
type Example = Examples[keyof Examples];

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

const summaryStats = {
  chromiumOld: {
    recordings: 0,
    tests: 0,
  },
  chromiumNew: {
    recordings: 0,
    tests: 0,
  },
  gecko: {
    recordings: 0,
    tests: 0,
  },
  node: {
    recordings: 0,
    tests: 0,
  },
};

for (let key in exampleJSON) {
  const { buildId } = exampleJSON[key as keyof Examples];

  if (buildId.includes("gecko")) {
    summaryStats.gecko.recordings++;
  } else if (buildId.includes("node")) {
    summaryStats.node.recordings++;
  } else {
    if (buildId.includes("2024")) {
      summaryStats.chromiumNew.recordings++;
    } else {
      summaryStats.chromiumOld.recordings++;
    }
  }

  testFileList.forEach(filePath => {
    const text = readFileSync(filePath, "utf8");
    if (text.includes(key)) {
      if (buildId.includes("gecko")) {
        summaryStats.gecko.tests++;
      } else if (buildId.includes("node")) {
        summaryStats.node.tests++;
      } else {
        if (buildId.includes("2024")) {
          summaryStats.chromiumNew.tests++;
        } else {
          summaryStats.chromiumOld.tests++;
        }
      }
    }
  });
}

console.log(`Searched ${testFileList.length} files and found:\n`, summaryStats);

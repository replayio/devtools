import { getStats } from "./scripts/get-stats";

const {
  browserSummaryStats,
  exampleToTestMap,
  osSummaryStats,
  releaseYearStats,
  sortedStats,
  testFileList,
} = getStats();

console.log(`Searched ${testFileList.length} tests`);
console.table(sortedStats);
console.table(browserSummaryStats);
console.table(osSummaryStats);
console.table(releaseYearStats);
console.log(exampleToTestMap);

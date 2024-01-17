import { getStats } from "./scripts/get-stats";

const {
  browserSummaryStats,
  osSummaryStats,
  releaseYearStats,
  sortedStats,
  testFileList,
  testFileToInfoMap,
} = getStats();

console.log(`Searched ${testFileList.length} tests`);
console.table(sortedStats);
console.table(browserSummaryStats);
console.table(osSummaryStats);
console.table(releaseYearStats);
console.table(testFileToInfoMap);

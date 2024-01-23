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

/* Log data in a format easily imported by Google Sheets
console.log(
  Object.entries(testFileToInfoMap)
    .map(([key, { recordingId, runtime, runtimeOS, runtimeReleaseDate }]) => {
      return [runtimeReleaseDate, runtimeOS, runtime, key, recordingId].join(",");
    })
    .join("\n")
);
*/

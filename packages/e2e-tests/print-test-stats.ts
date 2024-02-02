import mapValues from "lodash/mapValues";
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
console.table(
    mapValues(testFileToInfoMap,
      ({ exampleName, recordingId, runtime, runtimeOS, runtimeReleaseDate }) => {
        return {
          exampleName,
          runtimeReleaseDate: runtimeReleaseDate.toISOString().slice(0, 10) as any,
          runtimeOS,
          runtime,
          recordingId,
        };
      }
    )
);

/* Log data in a format easily imported by Google Sheets
console.log(
  Object.entries(testFileToInfoMap)
    .map(([key, { recordingId, runtime, runtimeOS, runtimeReleaseDate }]) => {
      return [runtimeReleaseDate, runtimeOS, runtime, key, recordingId].join(",");
    })
    .join("\n")
);
*/

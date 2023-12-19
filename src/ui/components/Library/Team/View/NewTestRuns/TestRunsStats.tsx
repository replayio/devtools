import groupBy from "lodash/groupBy";
import { useContext } from "react";

import { TestRunsContext } from "./TestRunsContextRoot";

export function TestRunsStats() {
  const { testRuns } = useContext(TestRunsContext);

  console.log({
    testRuns,
    groupedRuns: groupBy(
      testRuns.map(r => ({ ...r, _date: new Date(r.date).getDate() })),
      "_date"
    ),
  });

  const buildsCount = testRuns.length;
  const buildFailuresCount = testRuns.filter(r => r.results.counts.failed > 0).length;
  const buildFailureRate = buildFailuresCount / buildsCount;

  const testFailuresCount = testRuns.reduce((acc, r) => acc + r.results.counts.failed, 0);
  const testsCount = testRuns.reduce(
    (acc, r) => acc + r.results.counts.passed + r.results.counts.flaky,
    0
  );
  const testFailureRate = testFailuresCount / testsCount;

  return (
    <div className="flex flex-col">
      <div>
        Build failure rate: {(buildFailureRate * 100).toFixed(3)}% ({buildFailuresCount}/
        {buildsCount})
      </div>
      <div>
        Test failure rate: {(testFailureRate * 100).toFixed(3)}% ({testFailuresCount}/{testsCount})
      </div>
    </div>
  );
}

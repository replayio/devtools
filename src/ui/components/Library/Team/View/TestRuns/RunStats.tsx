import { useMemo } from "react";

import { TestRun } from "ui/hooks/tests";
import { groupRecordings } from "ui/utils/testRuns";

function Pill({ styles, value }: { styles: string; value: number }) {
  return (
    <div
      className={`flex h-[1.35rem] min-w-[1.35rem] items-center justify-center rounded-md text-xs font-bold ${styles}`}
    >
      {value}
    </div>
  );
}
export function RunStats({ testRun }: { testRun: TestRun }) {
  // TODO Don't keep re-computing this; it's expensive
  const { passedRecordings, failedRecordings, flakyRecordings } = useMemo(
    () => groupRecordings(testRun.results.recordings),
    [testRun.results.recordings]
  );

  const passed = passedRecordings.count;
  const failed = failedRecordings.count;
  const flakyCount = flakyRecordings.count;

  return (
    <div className="flex shrink space-x-2">
      {failed > 0 && <Pill styles="text-chrome bg-[#EB5757]" value={failed} />}
      {flakyCount > 0 && <Pill styles="text-chrome bg-[#FDBA00]" value={flakyCount} />}
      {passed > 0 && (
        <Pill styles="border border-[#219653] border-2 text-[#219653]" value={passed} />
      )}
    </div>
  );
}

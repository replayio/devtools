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
  const { passedRecordings, failedRecordings, flakyRecordings } = useMemo(
    () => groupRecordings(testRun.recordings),
    [testRun.recordings]
  );

  const passed = passedRecordings.length;
  const failed = failedRecordings.length;
  const flakyCount = flakyRecordings.length;

  return (
    <div className="flex shrink space-x-2">
      {failed > 0 && <Pill styles="text-chrome bg-[#EB5757]" value={failed} />}
      {flakyCount > 0 && <Pill styles="text-chrome bg-[#FDBA00]" value={flakyCount} />}

      {failed == 0 && passed > 0 && (
        <Pill styles="border border-[#219653] border-2 text-[#219653]" value={passed} />
      )}
    </div>
  );
}

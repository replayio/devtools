import { TestRun } from "ui/hooks/tests";

function Pill({ styles, value }: { styles: string; value: number }) {
  return (
    <div
      className={`flex h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-md px-1 text-xs font-bold ${styles}`}
    >
      {value}
    </div>
  );
}
export function RunStats({ testRun }: { testRun: TestRun }) {
  const failed = testRun.recordings.filter(r => r.metadata.test?.result === "failed").length;
  const passed = testRun.recordings.filter(r => r.metadata.test?.result === "passed").length;

  return (
    <div className="flex shrink space-x-2">
      {failed > 0 && <Pill styles="text-red-50 bg-red-400" value={failed} />}
      {/* {passed > 0 && <Pill styles="bg-green-400 text-green-50" value={passed} />} */}
    </div>
  );
}

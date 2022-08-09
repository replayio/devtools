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
  let passed = 0;
  let failed = 0;
  if (testRun.stats) {
    passed = testRun.stats.passed || 0;
    failed = testRun.stats.failed || 0;
  }

  return (
    <div className="flex space-x-2 shrink">
      {failed > 0 && <Pill styles="text-red-500 border border-red-500 border-3" value={failed} />}
      {failed == 0 && passed > 0 && <Pill styles="bg-green-500 text-green-50" value={passed} />}
    </div>
  );
}

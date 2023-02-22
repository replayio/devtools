import { TestRun } from "ui/hooks/tests";

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
  let passed = 0;
  let failed = 0;
  if (testRun.stats) {
    passed = testRun.stats.passed || 0;
    failed = testRun.stats.failed || 0;
  }

  return (
    <div className="flex shrink space-x-2">
      {failed > 0 && <Pill styles="text-chrome bg-[#EB5757]" value={failed} />}
      {failed == 0 && passed > 0 && (
        <Pill styles="border border-[#219653] border-2 text-[#219653]" value={passed} />
      )}
    </div>
  );
}

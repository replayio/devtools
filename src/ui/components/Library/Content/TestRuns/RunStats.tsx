import { TestRun } from "ui/hooks/tests";

export function RunStats({ testRun }: { testRun: TestRun }) {
  const failed = testRun.recordings.filter(r => r.metadata.test?.result === "failed").length;
  const passed = testRun.recordings.filter(r => r.metadata.test?.result === "passed").length;

  return (
    <div className="flex shrink space-x-2">
      {passed > 0 && (
        <div className="h-6 rounded-md bg-green-100 p-2 py-1 px-2  text-xs  text-green-700">
          {passed}
        </div>
      )}
      {failed > 0 && (
        <div className="h-6 rounded-md bg-red-100 p-2 py-1 px-2 text-xs  text-red-700">
          {failed}
        </div>
      )}
    </div>
  );
}

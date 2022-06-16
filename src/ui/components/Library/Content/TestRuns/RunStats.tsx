import { TestRun } from "ui/hooks/tests";

export function RunStats({ testRun }: { testRun: TestRun }) {
  const failed = testRun.recordings.filter(r => r.metadata.test?.result !== "passed").length;
  const passed = testRun.recordings.filter(r => r.metadata.test?.result !== "passed").length;

  return (
    <div className="flex space-x-1">
      <div className="p-2 py-1 font-medium text-green-700 bg-green-100 rounded-md">{passed}</div>
      <div className="p-2 py-1 font-medium text-red-700 bg-red-100 rounded-md">{failed}</div>
    </div>
  );
}

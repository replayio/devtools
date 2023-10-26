import { TestRunTest } from "shared/test-suites/TestRun";

export function getDuration(tests: TestRunTest[]) {
  return tests.reduce<number>((accumulated, test) => {
    return accumulated + test.durationMs;
  }, 0);
}

import { Reporter, ReporterOnStartOptions } from "@jest/reporters";
import { AggregatedResult, AssertionResult, Test, TestResult } from "@jest/test-result";

export default class CustomReporter implements Pick<Reporter, "onTestResult" | "onRunComplete"> {
  async onTestResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) {
    const { numPassingTests, numFailingTests } = testResult;
    console.log("Test complete: ", test.path, "Result: ", testResult.displayName, {
      numPassingTests,
      numFailingTests,
    });
  }

  async onRunComplete(_: any, results: AggregatedResult) {
    console.log("Run complete");
    console.log("First arg: ", _);
    console.log("Results: ", results);
  }
}

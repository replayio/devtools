import { Reporter, ReporterOnStartOptions } from "@jest/reporters";
import { AggregatedResult, AssertionResult, Test, TestResult } from "@jest/test-result";
import { create, ReportType, ReportOptions } from "istanbul-reports";
import { createContext, Watermarks } from "istanbul-lib-report";

/**
 * Options to the coverage repoter
 */
export interface CoverageReporterOptions {
  /**
   * Glob(s) defining file(s) to exclude from coverage tracking
   */
  exclude?: string | string[];

  /**
   * Root folder for resolving source files, defaults to playwright's `rootDir`
   */
  sourceRoot?: string;

  /**
   * Folder to write coverage reports to
   *
   * Relative paths are resolved to playwright's `rootDir`. Default value is `'coverage'`.
   */
  resultDir?: string;

  /**
   * Istanbul reports to generate, defaults to generate a `'text-summary'`
   */
  reports?: (ReportType | [ReportType, ReportOptions[ReportType] | undefined])[];

  /**
   * Watermarks for categorizing coverage results as low, medium or high
   */
  watermarks?: Partial<Watermarks>;

  /**
   * Function that yields the correct absolute path to a file
   *
   * This function can be used to get complete control over the paths to source files.
   * This can e.g. be used to remove a non-existing `/_N_E/` folder inserted by Next.js.
   *
   * If no function is passed, the absolute path passed into this function is used.
   */
  rewritePath?: (file: { relativePath: string; absolutePath: string }) => string;
}

export default class E2ECoverageReporter
  implements Pick<Reporter, "onTestResult" | "onRunComplete" | "onRunStart">
{
  private readonly exclude: readonly string[];
  private readonly resultDir: string;
  private readonly reports: (ReportType | [ReportType, ReportOptions[ReportType] | undefined])[];
  private readonly sourceRoot?: string;
  private readonly watermarks?: Partial<Watermarks>;
  private readonly rewritePath?: CoverageReporterOptions["rewritePath"];

  constructor(
    globalConfig: any,
    {
      exclude,
      sourceRoot,
      resultDir,
      reports = ["text-summary"],
      watermarks,
      rewritePath,
    }: CoverageReporterOptions = {}
  ) {
    this.exclude = typeof exclude === "string" ? [exclude] : exclude ?? [];
    this.resultDir = resultDir || "coverage";
    this.reports = reports;
    this.sourceRoot = sourceRoot;
    this.watermarks = watermarks;
    this.rewritePath = rewritePath;

    // console.log("Coverage reporter options", { exclude, sourceRoot, resultDir, reports });
  }

  onRunStart(results: AggregatedResult, options: ReporterOnStartOptions) {
    console.log("Test run starting: ", options);
  }

  async onTestResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) {
    const { numPassingTests, numFailingTests } = testResult;
    // console.log("Test complete: ", test.path, "Result: ", testResult.displayName, {
    //   numPassingTests,
    //   numFailingTests,
    // });
  }

  async onRunComplete(_: any, results: AggregatedResult) {
    // console.log("Run complete");
    // console.log("First arg: ", _);
    // console.log("Results: ", results);
  }
}

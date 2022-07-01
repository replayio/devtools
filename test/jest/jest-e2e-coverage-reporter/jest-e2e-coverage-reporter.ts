// Ported from https://github.com/bgotink/playwright-coverage
import path from "path";
import fs from "fs";
import { Reporter, ReporterOnStartOptions } from "@jest/reporters";
import type { Config as JestConfig } from "@jest/types";
import { AggregatedResult, AssertionResult, Test, TestResult } from "@jest/test-result";
import glob from "glob";

import { CoverageMapData, createCoverageMap } from "istanbul-lib-coverage";
import { createContext, Watermarks } from "istanbul-lib-report";
import { create, ReportType, ReportOptions } from "istanbul-reports";

import { Remote, wrap } from "comlink";
import { Worker } from "worker_threads";
import nodeEndpoint from "comlink/dist/umd/node-adapter";

import type { CoverageWorker } from "./worker.js";

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

  private readonly jestGlobalConfig: JestConfig.GlobalConfig;
  private readonly coverageFilesAlreadySeen: Set<string>;

  private readonly workerInstance: Worker;
  private readonly worker: Remote<CoverageWorker>;

  constructor(
    globalConfig: JestConfig.GlobalConfig,
    {
      exclude,
      sourceRoot,
      resultDir,
      reports = ["text-summary"],
      watermarks,
      rewritePath,
    }: CoverageReporterOptions = {}
  ) {
    this.jestGlobalConfig = globalConfig;
    this.exclude = typeof exclude === "string" ? [exclude] : exclude ?? [];
    this.resultDir = resultDir || "coverage";
    this.reports = reports;
    this.sourceRoot = sourceRoot;
    this.watermarks = watermarks;
    this.rewritePath = rewritePath;

    this.coverageFilesAlreadySeen = new Set();

    // Magic recipe for registering TS-Node before loading a worker file so that it's transpiled.
    // Ref: https://github.com/TypeStrong/ts-node/issues/711#issuecomment-679621830
    this.workerInstance = new Worker(
      `
    require('ts-node/register');
    require(require('worker_threads').workerData.runThisFileInTheWorker);
  `,
      {
        eval: true,
        workerData: {
          runThisFileInTheWorker: require.resolve("./worker.ts"), // '/path/to/worker-script.ts'
        },
      }
    );
    this.worker = wrap<CoverageWorker>(nodeEndpoint(this.workerInstance));

    // Workers apparently can't do console logging directly.
    // Listen for posted messages and log them to the console.
    this.workerInstance.on("message", msg => {
      if (msg.type === "RAW") {
        return;
      }
      console.log("Worker: ", msg);
    });
  }

  onRunStart(results: AggregatedResult, options: ReporterOnStartOptions) {
    this.worker.reset();
  }

  async onTestResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) {
    const testName = path.basename(test.path).replace(".test.ts", "");
    const coverageFolder = "./coverage/testCoverage";
    const filename = `${testName}.coverage.json`;
    const testCoveragePath = path.join(coverageFolder, filename);

    if (fs.existsSync(testCoveragePath)) {
      console.log("Starting conversion of coverage: ", testCoveragePath);
      this.coverageFilesAlreadySeen.add(testCoveragePath);
      this.worker.startConversion(testCoveragePath);
    } else {
      console.log("Could not find coverage file: ", testCoveragePath);
    }
  }

  async onRunComplete(_: any, results: AggregatedResult) {
    const sourceRoot = this.sourceRoot ?? this.jestGlobalConfig.rootDir;

    console.log(
      "Processing complete run results...",
      this.sourceRoot,
      this.jestGlobalConfig.rootDir
    );

    // Find all JSON files we've accumulated, regardless of whether they're in this test run or not
    const coverageJsonFiles = glob.sync("coverage/testCoverage/*.json");
    for (let coverageFilePath of coverageJsonFiles) {
      if (!this.coverageFilesAlreadySeen.has(coverageFilePath)) {
        console.log("Processing additional file: ", coverageFilePath);
        this.worker.startConversion(coverageFilePath);
      }
    }

    const totalCoverage = JSON.parse(
      await this.worker.getTotalCoverage(sourceRoot, this.exclude)
    ) as CoverageMapData;

    const coverage = createCoverageMap(
      Object.fromEntries(
        Object.entries(totalCoverage).map(([relativePath, data]) => {
          const absolutePath = path.resolve(sourceRoot, relativePath);
          const newPath = this.rewritePath?.({ absolutePath, relativePath }) ?? absolutePath;

          return [newPath, { ...data, path: newPath }];
        })
      )
    );

    const context = createContext({
      coverageMap: coverage,
      dir: path.resolve(this.jestGlobalConfig.rootDir, this.resultDir),
      watermarks: this.watermarks,

      sourceFinder: path => {
        try {
          return fs.readFileSync(path, "utf8");
        } catch (e) {
          throw new Error(`Failed to read ${path}: ${e}`);
        }
      },
    });

    for (const reporterConfig of this.reports) {
      let reporter;
      if (typeof reporterConfig === "string") {
        reporter = create(reporterConfig);
      } else {
        reporter = create(...reporterConfig);
      }

      reporter.execute(context);
    }
  }
}

process.on("uncaughtException", err => {
  console.error("Uncaught error in the reporter: " + err);
  process.exit(1);
});

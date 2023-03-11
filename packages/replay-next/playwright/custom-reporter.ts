import {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStatus,
} from "@playwright/test/reporter";

import windowSize from "window-size";

const FORMAT_BOLD = "\x1b[1m";
const FORMAT_COLOR_RED = "\x1b[31m";
const FORMAT_COLOR_GREEN = "\x1b[32m";
const FORMAT_DIM = "\x1b[2m";
const FORMAT_RESET = "\x1b[0m";

const CHARACTER_PENDING = "•";
const CHARACTER_FAILED = "✗";
const CHARACTER_PASSED = "✓";

type TestCaseMetadata = {
  finalStatus: TestStatus | null;
  testCase: TestCase;
  testRuns: Array<{
    logs: string[];
    status: TestStatus | null;
  }>;
};

export default class CustomerReporter implements Reporter {
  private completed: boolean = false;
  private logs: string[] = [];
  private testCaseMetadataMap = new Map<TestCase, TestCaseMetadata>();

  onBegin(config: FullConfig, suite: Suite) {
    // No-op
  }

  onEnd(result: FullResult) {
    this.completed = true;

    this.printSummary();
  }

  onTestBegin(testCase: TestCase, testResult: TestResult) {
    let testCaseMetadata = this.testCaseMetadataMap.get(testCase);
    if (testCaseMetadata == null) {
      testCaseMetadata = {
        finalStatus: null,
        testCase,
        testRuns: [],
      };

      this.testCaseMetadataMap.set(testCase, testCaseMetadata);
    }

    testCaseMetadata.testRuns.push({
      logs: [],
      status: null,
    });

    this.logs.push(`${FORMAT_BOLD}${testCase.title}${FORMAT_RESET}`);

    this.printSummary();
  }

  onTestEnd(testCase: TestCase, testResult: TestResult) {
    const testCaseMetadata = this.testCaseMetadataMap.get(testCase);
    if (testCaseMetadata) {
      const { testRuns } = testCaseMetadata;

      const currentTestRun = testRuns[testRuns.length - 1];
      currentTestRun.status = testResult.status;

      if (testResult.status === "passed" || testRuns.length > testCase.retries) {
        testCaseMetadata.finalStatus = testResult.status;
      }
    }
  }

  // TODO Track stdErr separately from stdOut
  onStdErr(chunk: Buffer | string, testCase: TestCase, testResult: TestResult) {
    const string = typeof chunk === "string" ? chunk : chunk.toString();

    const testCaseMetadata = this.testCaseMetadataMap.get(testCase);
    if (testCaseMetadata) {
      const { testRuns } = testCaseMetadata;

      const currentTestRun = testRuns[testRuns.length - 1];
      currentTestRun.logs.push(string.trim());
    }

    this.logs.push(`   ${string.trim()}`);

    this.printSummary();
  }

  onStdOut(chunk: Buffer | string, testCase: TestCase, testResult: TestResult) {
    const string = typeof chunk === "string" ? chunk : chunk.toString();

    const testCaseMetadata = this.testCaseMetadataMap.get(testCase);
    if (testCaseMetadata) {
      const { testRuns } = testCaseMetadata;

      const currentTestRun = testRuns[testRuns.length - 1];
      currentTestRun.logs.push(string.trim());
    }

    this.logs.push(`   ${string.trim()}`);

    this.printSummary();
  }

  private printSummary() {
    const logLines: string[] = [];

    let numPending = 0;
    let numFailed = 0;
    let numPassed = 0;

    for (let testCaseMetadata of this.testCaseMetadataMap.values()) {
      switch (testCaseMetadata.finalStatus) {
        case "failed":
          numFailed++;
          break;
        case "passed":
          numPassed++;
          break;
        default:
          numPending++;
          break;
      }
    }

    const summaries = [];
    summaries.push(`${FORMAT_DIM}${CHARACTER_PENDING}${FORMAT_RESET} ${numPending}`);
    summaries.push(`${FORMAT_COLOR_RED}${CHARACTER_FAILED}${FORMAT_RESET} ${numFailed}`);
    summaries.push(`${FORMAT_COLOR_GREEN}${CHARACTER_PASSED}${FORMAT_RESET} ${numPassed}`);

    logLines.push(`Tests running  ${summaries.join("  ")}`);
    logLines.push("");

    const values = this.testCaseMetadataMap.values();

    const maxTestNumber = this.testCaseMetadataMap.size;
    const maxTestNumberChars = `${maxTestNumber}`.length;

    const formatTestIndex = (index: number) => {
      const testNumber = index + 1;
      const testNumberChars = `${testNumber}`.length;
      const delta = maxTestNumberChars - testNumberChars;

      return `${" ".repeat(delta)}${testNumber}`;
    };

    Array.from(values).forEach(({ finalStatus, testCase, testRuns }, mapIndex) => {
      const { title } = testCase;

      let prefix;
      let prefixFormat = "";
      let titleFormat = FORMAT_BOLD;
      switch (finalStatus) {
        case "failed":
          prefix = CHARACTER_FAILED;
          prefixFormat = FORMAT_COLOR_RED;
          titleFormat += FORMAT_COLOR_RED;
          break;
        case "passed":
          prefix = CHARACTER_PASSED;
          prefixFormat = FORMAT_COLOR_GREEN;
          break;
        default:
          prefix = CHARACTER_PENDING;
          prefixFormat = FORMAT_DIM;
          break;
      }

      let suffix = "";
      if (finalStatus !== null) {
        if (testRuns.length > 1) {
          suffix = ` ${FORMAT_DIM}(${testRuns.length - 1} retries)${FORMAT_RESET}`;
        }
      }

      logLines.push(
        `${FORMAT_DIM}${formatTestIndex(
          mapIndex
        )}${FORMAT_RESET} ${prefixFormat}${prefix}${FORMAT_RESET} ${titleFormat}${title}${FORMAT_RESET}${suffix}`
      );

      const minIndent = " ".repeat(maxTestNumberChars + 3);

      if (this.completed || finalStatus === null) {
        testRuns.forEach((testRun, index) => {
          if (index > 0) {
            let label;
            let labelFormat = "";
            switch (testRun.status) {
              case "failed":
                label = "Failed";
                labelFormat = FORMAT_COLOR_RED;
                break;
              case "passed":
                label = "Passed";
                labelFormat = FORMAT_COLOR_GREEN;
                break;
              default:
                label = "Running";
                break;
            }

            if (testRuns.length > 1) {
              logLines.push(
                `${minIndent}${labelFormat}${label}${FORMAT_RESET} ${FORMAT_DIM}(retry ${index})${FORMAT_RESET}`
              );
            }
          }

          testRun.logs.forEach(log => {
            logLines.push(`${minIndent}  ${log}`);
          });
        });
      }
    });

    clear();
    print(logLines.filter(line => line.trim() !== "").join("\n") + "\n", !this.completed);
  }
}

const out = process.stdout;
const printedLines: string[] = [];

function print(text: string, trimToFit: boolean) {
  const { width: columns } = windowSize.get();

  let newLines = text.split("\n");

  if (trimToFit) {
    newLines = newLines.map(line => {
      if (line.length > columns) {
        return line.slice(0, columns) + "…" + FORMAT_RESET;
      } else {
        return line;
      }
    });
  }

  printedLines.push(...newLines);

  out.write(newLines.join("\n"));
}

function clear(): void {
  out.moveCursor(0, 0 - printedLines.length);
  out.clearScreenDown();

  printedLines.splice(0);
}

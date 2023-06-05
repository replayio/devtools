import { ComponentProps } from "react";

import { TestResult } from "shared/graphql/types";
import { IncrementalGroupedTestCases } from "shared/test-suites/types";
import Icon from "ui/components/shared/Icon";

import styles from "./TestResultIcon.module.css";

export function TestResultIcon({
  className = "",
  result,
  ...rest
}: { result: TestResult } & Omit<ComponentProps<typeof Icon>, "filename">) {
  let filename;

  switch (result) {
    case "skipped":
    case "unknown":
      className = `${className} ${styles.SkippedIcon}`;
      filename = "testsuites-skip";
      break;
    case "passed":
      className = `${className} ${styles.SuccessIcon}`;
      filename = "testsuites-success";
      break;
    default:
      className = `${className} ${styles.ErrorIcon}`;
      filename = "testsuites-fail";
      break;
  }

  return <Icon size="small" {...rest} className={className} filename={filename} />;
}

export function getResultFromResultCounts(
  resultCounts: IncrementalGroupedTestCases["resultCounts"]
): TestResult {
  const { failed, passed, skipped, timedOut } = resultCounts;

  if (failed > 0) {
    return "failed";
  } else if (timedOut > 0) {
    return "timedOut";
  } else if (skipped > 0) {
    return "skipped";
  } else if (passed > 0) {
    return "passed";
  } else {
    return "unknown";
  }
}

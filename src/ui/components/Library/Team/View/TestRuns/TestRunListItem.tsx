import { useContext } from "react";

import { TestRun, getTestRunTitle } from "shared/test-suites/TestRun";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";

import { getTruncatedRelativeDate } from "../Recordings/RecordingListItem/RecordingListItem";
<<<<<<< HEAD
import { TestRunLibraryRow } from "./TestRunLibraryRow";
=======
import HighlightedText from "./HighlightedText";
>>>>>>> 2e33334b8 (chore: standardize test run imports)
import { TestRunsContext } from "./TestRunsContextRoot";
import styles from "./TestRunListItem.module.css";

function Status({ failCount }: { failCount: number }) {
  const status = failCount > 0 ? "fail" : "success";

  if (failCount > 0) {
    return (
      <div
        className="flex h-5 w-8 shrink-0 items-center justify-center rounded-md bg-[color:var(--testsuites-v2-failed-pill)] text-xs font-bold text-white text-chrome"
        data-test-status={status}
      >
        {failCount}
      </div>
    );
  } else {
    return (
      <div className="flex w-8 flex-shrink-0 flex-col items-center" data-test-status={status}>
        <Icon className={styles.testsuitesSuccess} filename={"testsuites-success"} size="medium" />
      </div>
    );
  }
}

export function TestRunListItem({
  filterByText,
  testRun,
}: {
  filterByText: string;
  testRun: TestRun;
}) {
  const { date } = testRun;

  const { selectTestRun, testRunIdForDisplay } = useContext(TestRunsContext);

  const title = getTestRunTitle(testRun);

  const failCount = testRun.results.counts.failed;
  const isSelected = testRunIdForDisplay === testRun.id;

  const onClick = () => {
    selectTestRun(testRun.id);
  };

  return (
    <TestRunLibraryRow
      isSelected={isSelected}
      data-test-id="TestRunListItem"
      className="cursor-pointer space-x-3 bg-themeBase-100 px-2 py-1"
      onClick={onClick}
    >
      <Status failCount={failCount} />
      <div className="flex h-full flex-grow flex-row justify-between overflow-hidden">
        <div className="wrap flex shrink grow-0 truncate pr-2" data-test-id="TestRun-Title">
          <HighlightedText haystack={title} needle={filterByText} />
        </div>
        <div
          className="flex flex-shrink-0 items-center space-x-0.5 overflow-hidden text-ellipsis"
          data-test-id="TestRun-Date"
          title={title ?? ""}
        >
          <MaterialIcon className="w-4">schedule</MaterialIcon>
          <span className="block overflow-hidden text-ellipsis whitespace-pre text-xs font-light">
            {getTruncatedRelativeDate(date, false)}
          </span>
        </div>
      </div>
    </TestRunLibraryRow>
  );
}

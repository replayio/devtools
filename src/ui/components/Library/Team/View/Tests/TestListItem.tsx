import { useContext } from "react";

import { Test } from "shared/test-suites/TestRun";
import HighlightedText from "ui/components/Library/Team/View/TestRuns/HighlightedText";

import { TestContext } from "./TestContextRoot";
import styles from "../../../Library.module.css";

export function TestListItem({ filterByText, test }: { filterByText: string; test: Test }) {
  const { selectTestId, testIdForDisplay } = useContext(TestContext);
  const isSelected = testIdForDisplay === test.testId;

  const onClick = () => {
    selectTestId(test.testId);
  };

  return (
    <div
      data-test-id="TestListItem"
      className={`flex cursor-pointer flex-row items-center space-x-3 rounded-sm border-b border-chrome bg-themeBase-100 p-3 ${
        styles.libraryRow
      }
      ${isSelected ? styles.libraryRowSelected : ""}
      `}
      onClick={onClick}
    >
      <div className="flex h-full flex-grow flex-col justify-evenly overflow-hidden">
        <div className="flex flex-row justify-between space-x-3">
          <div
            className="wrap flex shrink grow-0 overflow-hidden text-ellipsis whitespace-nowrap pr-2 font-medium"
            data-test-id="Test-Title"
          >
            <HighlightedText haystack={test.title} needle={filterByText} />
          </div>
        </div>
      </div>
    </div>
  );
}

import assert from "assert";
import {
  unstable_Activity as Activity,
  ReactNode,
  memo,
  useContext,
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import Icon from "replay-next/components/Icon";
import FileIcon from "ui/components/shared/Icon";
import { TestGroup } from "ui/utils/testRuns";

import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import {
  FileNode,
  PathNode,
  isPathNode,
  treeContainTest,
  useFileNameTree,
} from "../hooks/useFileNameTree";
import { useTestRunDetailsSuspends } from "../hooks/useTestRunDetailsSuspends";
import { TestRunLibraryRow } from "../TestRunLibraryRow";
import { TestRunsContext } from "../TestRunsContextRoot";
import styles from "./RunResults.module.css";

export function RunResults({
  filterCurrentRunByStatus,
}: {
  filterCurrentRunByStatus: "all" | "failed-and-flaky";
}) {
  const { filterTestsByText, testRunIdForSuspense } = useContext(TestRunsContext);
  const filterByTextDeferred = useDeferredValue(filterTestsByText);
  const { groupedTests, tests } = useTestRunDetailsSuspends(testRunIdForSuspense);
  assert(groupedTests !== null);

  const { passedRecordings, failedRecordings, flakyRecordings } = groupedTests;

  if (!tests?.length) {
    return (
      <TestSuitePanelMessage data-test-id="NoTestRunSelected" className={styles.noTestsMessage}>
        No test data available for this test run
      </TestSuitePanelMessage>
    );
  }

  return (
    <div
      className="flex flex-col overflow-y-auto"
      data-filtered-by-status={filterCurrentRunByStatus}
      data-filtered-by-text={filterByTextDeferred}
      data-test-id="TestRunResults"
    >
      <TestStatusGroup
        filterByText={filterByTextDeferred}
        label="Failed"
        testGroup={failedRecordings}
      />
      <TestStatusGroup
        filterByText={filterByTextDeferred}
        label="Flaky"
        testGroup={flakyRecordings}
      />
      {filterCurrentRunByStatus !== "failed-and-flaky" && (
        <TestStatusGroup
          filterByText={filterByTextDeferred}
          label="Passed"
          testGroup={passedRecordings}
        />
      )}
    </div>
  );
}

function TestStatusGroup({
  filterByText,
  label,
  testGroup,
}: {
  filterByText: string;
  label: string;
  testGroup: TestGroup;
}) {
  const [expanded, setExpanded] = useState(true);

  const tree = useFileNameTree(testGroup, filterByText);

  const count = testGroup.count;
  if (count == 0) {
    return null;
  }

  return (
    <div
      className="flex flex-col"
      data-test-id={`TestRunResults-StatusGroup-${label.toLowerCase()}`}
    >
      <div
        data-test-id="TestRunResults-StatusGroup-Title"
        className="top-0 flex grow flex-row p-2 pl-4 font-medium hover:cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div data-status={label} className={`grow font-bold ${styles.testStatusHeader}`}>
          <span data-test-id="TestRunResults-StatusGroup-Count">{count}</span> {label} Test
          {count > 1 ? "s" : ""}
        </div>
        <div className="flex">
          <Icon
            data-test-id="TestRunResults-StatusGroup-Icon"
            data-test-state={expanded ? "expanded" : "collapsed"}
            className={`${
              expanded ? "" : "rotate-90"
            } rotate duration-140 h-4 w-4 transition ease-out`}
            type="chevron-down"
          />
        </div>
      </div>
      <Activity mode={expanded ? "visible" : "hidden"}>
        <PathNodeRenderer depth={1} filterByText={filterByText} label={label} pathNode={tree} />
      </Activity>
    </div>
  );
}

const FileNodeRenderer = memo(function FileNodeRenderer({
  depth,
  label,
  fileNode,
}: {
  depth: number;
  label: string;
  fileNode: FileNode;
}) {
  const { test } = fileNode;
  const currentTestId = test.testId;
  const { setTestId, testId } = useContext(TestRunsContext);

  const onClick = () => setTestId(currentTestId);

  let iconFilename: string;
  let iconClass: string;
  if (label === "Passed") {
    iconFilename = "testsuites-success";
    iconClass = styles.testsuitesSuccess;
  } else if (label === "Failed") {
    iconClass = styles.testsuitesFailed;
    iconFilename = "testsuites-v2-failed";
  } else {
    iconClass = styles.testsuitesFlaky;
    iconFilename = "testsuites-v2-flaky";
  }

  const isSelected = currentTestId === testId;

  return (
    <TestRunLibraryRow
      isSelected={isSelected}
      className="cursor-pointer gap-2 truncate py-1.5 pr-4"
      data-test-id="TestRunResult-FileNode"
      onClick={onClick}
      style={{
        paddingLeft: `${depth * 1}rem`,
      }}
    >
      <FileIcon className={iconClass} filename={iconFilename} />
      <div className="truncate">{fileNode.name}</div>
    </TestRunLibraryRow>
  );
});

function PathNodeRenderer({
  depth,
  filterByText,
  label,
  pathNode,
}: {
  depth: number;
  filterByText: string;
  label: string;
  pathNode: PathNode;
}) {
  const { children, name, pathNames } = pathNode;
  const [expanded, setExpanded] = useState(true);
  const { testId } = useContext(TestRunsContext);

  const containsSelectedSpec = useMemo(() => {
    if (expanded || !testId) {
      return false;
    }

    return treeContainTest(children, testId);
  }, [children, expanded, testId]);

  const onClick = () => setExpanded(!expanded);

  const formattedNames: ReactNode[] = [];
  pathNames.forEach((pathName, index) => {
    if (index > 0) {
      formattedNames.push(
        <div key={`${index}-separator`} className="text-xs text-bodySubColor">
          /
        </div>
      );
    }

    formattedNames.push(<div key={index}>{pathName}</div>);
  });

  return (
    <>
      {name && (
        <TestRunLibraryRow
          isSelected={containsSelectedSpec}
          className="cursor-pointer truncate py-2 pr-4"
          data-test-id="TestRunResult-PathNode"
          data-test-state={expanded ? "expanded" : "collapsed"}
          onClick={onClick}
          style={{
            paddingLeft: `${depth * 1}rem`,
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 truncate">{formattedNames}/</div>
            <Icon
              data-test-id="TestRunResult-PathNode-Icon"
              data-test-state={expanded ? "expanded" : "collapsed"}
              className={`${
                expanded ? "" : "rotate-90"
              } rotate duration-140 h-4 w-4 transition ease-out`}
              type="chevron-down"
            />
          </div>
          {!expanded && (
            <div className="text-xs text-bodySubColor">({pathNode.nestedTestCount} tests)</div>
          )}
        </TestRunLibraryRow>
      )}
      <Activity mode={expanded ? "visible" : "hidden"}>
        {children.map((childNode, index) => {
          if (isPathNode(childNode)) {
            return (
              <PathNodeRenderer
                depth={depth + 1}
                filterByText={filterByText}
                key={index}
                label={label}
                pathNode={childNode}
              />
            );
          } else {
            return (
              <FileNodeRenderer depth={depth + 1} key={index} label={label} fileNode={childNode} />
            );
          }
        })}
      </Activity>
    </>
  );
}

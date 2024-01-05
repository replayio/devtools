import assert from "assert";
import {
  unstable_Offscreen as Offscreen,
  ReactNode,
  memo,
  useContext,
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import Icon from "replay-next/components/Icon";
import { TestRunsContext } from "ui/components/Library/Team/View/NewTestRuns/TestRunsContextRoot";
import { useTestRunDetailsSuspends } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRunDetailsSuspends";
import {
  FileNode,
  PathNode,
  isPathNode,
  treeContainFile,
  useFileNameTree,
} from "ui/components/Library/Team/View/TestRuns/Overview/useFileNameTree";
import FileIcon from "ui/components/shared/Icon";
import { TestGroup } from "ui/utils/testRuns";

import styles from "../TestRuns.module.css";

export function RunResults({
  testFilterByText,
  filterCurrentRunByStatus,
}: {
  testFilterByText: string;
  filterCurrentRunByStatus: "all" | "failed-and-flaky";
}) {
  const { testRunId } = useContext(TestRunsContext);

  const filterByTextDeferred = useDeferredValue(testFilterByText);

  const { groupedTests } = useTestRunDetailsSuspends(testRunId);
  assert(groupedTests !== null);

  const { passedRecordings, failedRecordings, flakyRecordings } = groupedTests;

  return (
    <div
      className="flex flex-col overflow-y-auto"
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
        className={`top-0 flex grow flex-row p-2 pl-4 font-medium hover:cursor-pointer ${styles.libraryRowHeader}`}
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
      <Offscreen mode={expanded ? "visible" : "hidden"}>
        <PathNodeRenderer depth={1} filterByText={filterByText} label={label} pathNode={tree} />
      </Offscreen>
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
  const { absolutePath, tests } = fileNode;
  const { setSpec, spec } = useContext(TestRunsContext);

  const onClick = () => setSpec(absolutePath);

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

  const isSelected = absolutePath === spec;

  return (
    <>
      <div
        className={`flex cursor-pointer items-center gap-2 truncate rounded py-1.5 pr-4 ${
          styles.libraryRow
        } ${isSelected ? styles.libraryRowSelected : ""}`}
        data-test-id="TestRunResult-FileNode"
        onClick={onClick}
        style={{
          paddingLeft: `${depth * 1}rem`,
        }}
      >
        <FileIcon className={iconClass} filename={iconFilename} />
        <div className="truncate">{tests[0].title}</div>
      </div>
    </>
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
  const { spec } = useContext(TestRunsContext);

  const containsSelectedSpec = useMemo(() => {
    if (expanded || !spec) {
      return false;
    }

    return treeContainFile(children, spec);
  }, [children, expanded, spec]);

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
        <div
          className={`cursor-pointer truncate rounded py-2 pr-4 ${styles.libraryRow} ${
            containsSelectedSpec ? styles.libraryRowSelected : ""
          }`}
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
        </div>
      )}
      <Offscreen mode={expanded ? "visible" : "hidden"}>
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
      </Offscreen>
    </>
  );
}

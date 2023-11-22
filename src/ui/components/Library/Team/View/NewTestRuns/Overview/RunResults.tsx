import assert from "assert";
import {
  unstable_Offscreen as Offscreen,
  ReactNode,
  memo,
  useContext,
  useDeferredValue,
  useState,
} from "react";

import Icon, { IconType } from "replay-next/components/Icon";
import { useTestRunDetailsSuspends } from "ui/components/Library/Team/View/NewTestRuns/hooks/useTestRunDetailsSuspends";
import {
  FileNode,
  PathNode,
  isPathNode,
  useFileNameTree,
} from "ui/components/Library/Team/View/NewTestRuns/Overview/useFileNameTree";
import { TestRunsContext } from "ui/components/Library/Team/View/NewTestRuns/TestRunsContextRoot";
import { TestGroup, testPassed } from "ui/utils/testRuns";

import styles from "../../../../Library.module.css";

export function RunResults({
  isPending,
  testFilterByText,
}: {
  isPending: boolean;
  testFilterByText: string;
}) {
  const { testRunId } = useContext(TestRunsContext);

  const filterByTextDeferred = useDeferredValue(testFilterByText);

  const { groupedTests } = useTestRunDetailsSuspends(testRunId);
  assert(groupedTests !== null);

  const { passedRecordings, failedRecordings, flakyRecordings } = groupedTests;

  return (
    <div
      className={`no-scrollbar flex flex-col overflow-y-auto ${isPending ? "opacity-50" : ""}`}
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
      <TestStatusGroup
        filterByText={filterByTextDeferred}
        label="Passed"
        testGroup={passedRecordings}
      />
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
        className={`top-0 flex grow flex-row p-2 pl-4 font-medium hover:cursor-pointer ${styles.libraryRowHeader}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="grow">
          <span data-test-id="TestRunResults-StatusGroup-Count">{count}</span> {label} Test
          {count > 1 ? "s" : ""}
        </div>
        <div className="flex">
          <Icon
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
  filterByText,
  label,
  fileNode,
  path,
}: {
  depth: number;
  filterByText: string;
  label: string;
  fileNode: FileNode;
  path: string;
}) {
  const { name, tests } = fileNode;
  const { setSpec } = useContext(TestRunsContext);

  const onClick = () => {
    if (path) {
      setSpec(path + "/" + name);
    } else {
      setSpec(name);
    }
  };

  let type: IconType;

  if (label === "Passed") {
    type = "file";
  } else if (label === "Failed") {
    type = "error";
  } else {
    type = "warning";
  }

  return (
    <>
      <div
        className={`flex cursor-pointer items-center gap-2 truncate  py-2  pr-4 ${styles.libraryRow}`}
        data-test-id="TestRunResult-FileNode"
        onClick={onClick}
        style={{
          paddingLeft: `${depth * 1}rem`,
        }}
      >
        <Icon className="h-5 w-5 shrink-0" type={type} />
        <div className="truncate">{name}</div>
      </div>
    </>
  );
  // return (
  //   <>
  //     <div
  //       className={`flex cursor-pointer items-center gap-2 truncate  py-2  pr-4 ${styles.libraryRow}`}
  //       data-test-id="TestRunResult-FileNode"
  //       data-test-state={expanded ? "expanded" : "collapsed"}
  //       onClick={onClick}
  //       style={{
  //         paddingLeft: `${depth * 1}rem`,
  //       }}
  //     >
  //       <Icon className="h-5 w-5 shrink-0" type="file" />
  //       <div className="truncate">{name}</div>
  //       {!expanded && <div className="text-xs text-bodySubColor">({tests.length} tests)</div>}
  //     </div>
  //     <Offscreen mode={expanded ? "visible" : "hidden"}>
  //       {tests.flatMap(test =>
  //         test.recordings.map(recording => (
  //           <TestResultListItem
  //             depth={depth + 1}
  //             filterByText={filterByText}
  //             key={recording.id}
  //             label={testPassed(test) ? "Passed" : label}
  //             recording={recording}
  //             test={test}
  //             secondaryBadgeCount={/* index > 0 ? index + 1 : null */ null}
  //           />
  //         ))
  //       )}
  //     </Offscreen>
  //   </>
  // );
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
          className={`flex cursor-pointer items-center gap-2 truncate py-2 pr-4 ${styles.libraryRow}`}
          data-test-id="TestRunResult-PathNode"
          data-test-state={expanded ? "expanded" : "collapsed"}
          onClick={onClick}
          style={{
            paddingLeft: `${depth * 1}rem`,
          }}
        >
          <Icon className="h-5 w-5 shrink-0" type={expanded ? "folder-open" : "folder-closed"} />
          <div className="flex items-center gap-1 truncate">{formattedNames}</div>
          {!expanded && (
            <div className="text-xs text-bodySubColor">({pathNode.nestedRecordingCount} tests)</div>
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
              <FileNodeRenderer
                depth={depth + 1}
                filterByText={filterByText}
                key={index}
                label={label}
                fileNode={childNode}
                path={name}
              />
            );
          }
        })}
      </Offscreen>
    </>
  );
}

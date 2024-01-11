import assert from "assert";
import {
  unstable_Offscreen as Offscreen,
  ReactNode,
  memo,
  useContext,
  useDeferredValue,
  useState,
} from "react";

import Icon from "replay-next/components/Icon";
import { useTestRunDetailsSuspends } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRunDetailsSuspends";
import {
  FileNode,
  PathNode,
  isPathNode,
  useFileNameTree,
} from "ui/components/Library/Team/View/TestRuns/Overview/useFileNameTree";
import { TestRunsContext } from "ui/components/Library/Team/View/TestRuns/TestRunsContextRoot";
import { TestGroup, TestGroups } from "ui/utils/testRuns";

import { TestResultListItem } from "./TestResultListItem";
import styles from "../../../../Testsuites.module.css";

function hasDuplicateRecordings(fileNameToTests: TestGroup["fileNameToTests"]) {
  return Object.values(fileNameToTests).some(tests => {
    const recordingIds = new Set<string>();
    for (const test of tests) {
      for (const execution of test.executions) {
        for (const recording of execution.recordings) {
          if (recordingIds.has(recording.id)) {
            return true;
          } else {
            recordingIds.add(recording.id);
          }
        }
      }
    }

    return false;
  });
}

function DeepLinkWarning({ testGroups }: { testGroups: TestGroups }) {
  const duplicate =
    hasDuplicateRecordings(testGroups.failedRecordings.fileNameToTests) ||
    hasDuplicateRecordings(testGroups.passedRecordings.fileNameToTests) ||
    hasDuplicateRecordings(testGroups.flakyRecordings.fileNameToTests);

  if (!duplicate) {
    return null;
  }

  return (
    <div
      className="m-2 flex flex-row items-center gap-2 rounded-lg border p-2"
      style={{
        color: "var(--theme-warning-color)",
        backgroundColor: "var(--theme-warning-background)",
        borderColor: "var(--theme-warning-border)",
      }}
    >
      <Icon type="warning" /> Heads up! Deep linking to tests within a recording will be added soon.
    </div>
  );
}

export function RunResults({ isPending }: { isPending: boolean }) {
  const { testRunId } = useContext(TestRunsContext);

  const [filterByText, setFilterByText] = useState("");
  const filterByTextDeferred = useDeferredValue(filterByText);

  const { groupedTests } = useTestRunDetailsSuspends(testRunId);
  assert(groupedTests !== null);

  const { passedRecordings, failedRecordings, flakyRecordings } = groupedTests;

  return (
    <>
      <div
        className={`relative mb-2 border-b border-themeBorder bg-bodyBgcolor p-2 ${
          isPending ? "opacity-50" : ""
        }`}
      >
        <input
          className={`w-full appearance-none rounded border-none text-xs focus:outline-none focus:ring focus:ring-primaryAccent ${styles.FilterTestsFilter}`}
          data-test-id="TestRunResults-FilterInput"
          onChange={event => setFilterByText(event.currentTarget.value)}
          placeholder="Filter tests"
          type="text"
          value={filterByText}
        />

        <Icon
          className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
          type="search"
        />
      </div>
      <div
        className={`flex flex-col overflow-y-auto ${isPending ? "opacity-50" : ""}`}
        data-filtered-by-text={filterByTextDeferred}
        data-test-id="TestRunResults"
      >
        <DeepLinkWarning testGroups={groupedTests} />
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
    </>
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
}: {
  depth: number;
  filterByText: string;
  label: string;
  fileNode: FileNode;
}) {
  const { name, test, nestedRecordingCount } = fileNode;

  const [expanded, setExpanded] = useState(true);

  const onClick = () => setExpanded(!expanded);

  return (
    <>
      <div
        className={`flex cursor-pointer items-center gap-2 truncate  py-2  pr-4 ${styles.libraryRow}`}
        data-test-id="TestRunResult-FileNode"
        data-test-state={expanded ? "expanded" : "collapsed"}
        onClick={onClick}
        style={{
          paddingLeft: `${depth * 1}rem`,
        }}
      >
        <Icon className="h-5 w-5 shrink-0" type="file" />
        <div className="truncate">{name}</div>
        {!expanded && (
          <div className="text-xs text-bodySubColor">
            ({nestedRecordingCount} {nestedRecordingCount === 1 ? "test" : "tests"})
          </div>
        )}
      </div>
      <Offscreen mode={expanded ? "visible" : "hidden"}>
        {test.executions
          .filter(e => e.recordings.length > 0)
          .flatMap(execution =>
            execution.recordings.map(recording => (
              <TestResultListItem
                depth={depth + 1}
                filterByText={filterByText}
                key={test.id + recording.id}
                label={execution.result}
                recording={recording}
                test={test}
                secondaryBadgeCount={/* index > 0 ? index + 1 : null */ null}
              />
            ))
          )}
      </Offscreen>
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
            paddingLeft: `${depth * 0.5}rem`,
          }}
        >
          <Icon className="h-5 w-5 shrink-0" type={expanded ? "folder-open" : "folder-closed"} />
          <div className="flex items-center gap-1 truncate">{formattedNames}</div>
          {!expanded && (
            <div className="text-xs text-bodySubColor">
              ({pathNode.nestedTestCount} {pathNode.nestedTestCount === 1 ? "test" : "tests"})
            </div>
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
              />
            );
          }
        })}
      </Offscreen>
    </>
  );
}

import { useContext, useMemo, useState } from "react";

import Icon from "replay-next/components/Icon";
import {
  FileNode,
  PathNode,
  isPathNode,
  useFileNameTree,
} from "ui/components/Library/Team/View/TestRuns/Overview/useFileNameTree";
import { RecordingGroup, groupRecordings } from "ui/utils/testRuns";

import { TestResultListItem } from "./TestResultListItem";
import { TestRunOverviewContext } from "./TestRunOverviewContainerContextType";
import styles from "../../../../Library.module.css";

export function RunResults() {
  const testSuite = useContext(TestRunOverviewContext).testSuite!;

  // TODO Don't keep re-computing this; it's expensive
  const { passedRecordings, failedRecordings, flakyRecordings } = useMemo(
    () => groupRecordings(testSuite.results.recordings),
    [testSuite.results.recordings]
  );

  return (
    <div className="no-scrollbar flex flex-col overflow-y-auto">
      <TestStatusGroup label="Failed" recordingGroup={failedRecordings} />
      <TestStatusGroup label="Flaky" recordingGroup={flakyRecordings} />
      <TestStatusGroup label="Passed" recordingGroup={passedRecordings} />
    </div>
  );
}

function TestStatusGroup({
  label,
  recordingGroup,
}: {
  label: string;
  recordingGroup: RecordingGroup;
}) {
  const [expanded, setExpanded] = useState(true);
  const count = recordingGroup.count;
  if (count == 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div
        className={`top-0 flex grow flex-row p-2 pl-4 font-medium hover:cursor-pointer ${styles.libraryRowHeader}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="grow">
          {count} {label} Test{count > 1 ? "s" : ""}
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
      {expanded && <TestStatusGroupExpanded label={label} recordingGroup={recordingGroup} />}
    </div>
  );
}

function TestStatusGroupExpanded({
  label,
  recordingGroup,
}: {
  label: string;
  recordingGroup: RecordingGroup;
}) {
  const tree = useFileNameTree(recordingGroup);

  return <PathNodeRenderer depth={1} label={label} pathNode={tree} />;
}

function FileNodeRenderer({
  depth,
  label,
  fileNode,
}: {
  depth: number;
  label: string;
  fileNode: FileNode;
}) {
  const { fileName, recordings } = fileNode;

  const [expanded, setExpanded] = useState(true);

  const onClick = () => setExpanded(!expanded);

  return (
    <>
      <div
        className={`flex cursor-pointer items-center gap-2 py-2 ${styles.libraryRow}`}
        onClick={onClick}
        style={{
          paddingLeft: `${depth * 1}rem`,
        }}
      >
        <Icon className="h-5 w-5" type="file" />
        <div>{fileName}</div>
        {!expanded && <div className="text-xs text-bodySubColor">({recordings.length} tests)</div>}
      </div>
      {expanded &&
        recordings.map(recording => (
          <TestResultListItem
            depth={depth + 1}
            key={recording.id}
            label={label}
            recording={recording}
            secondaryBadgeCount={/* index > 0 ? index + 1 : null */ null}
          />
        ))}
    </>
  );
}

function PathNodeRenderer({
  depth,
  label,
  pathNode,
}: {
  depth: number;
  label: string;
  pathNode: PathNode;
}) {
  const { children, pathName } = pathNode;

  const [expanded, setExpanded] = useState(true);

  const onClick = () => setExpanded(!expanded);

  return (
    <>
      {pathName && (
        <div
          className={`flex cursor-pointer items-center gap-2 py-2 ${styles.libraryRow}`}
          onClick={onClick}
          style={{
            paddingLeft: `${depth * 1}rem`,
          }}
        >
          <Icon className="h-5 w-5" type={expanded ? "folder-open" : "folder-closed"} />
          {pathName}
          {!expanded && (
            <div className="text-xs text-bodySubColor">({pathNode.nestedRecordingCount} tests)</div>
          )}
        </div>
      )}
      {expanded &&
        Array.from(Object.values(children)).map((childNode, index) => {
          if (isPathNode(childNode)) {
            return (
              <PathNodeRenderer depth={depth + 1} key={index} label={label} pathNode={childNode} />
            );
          } else {
            return (
              <FileNodeRenderer depth={depth + 1} key={index} label={label} fileNode={childNode} />
            );
          }
        })}
    </>
  );
}

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
  const { summary } = useContext(TestRunOverviewContext);
  assert(summary !== null);

  const [filterByText, setFilterByText] = useState("");
  const filterByTextDeferred = useDeferredValue(filterByText);

  // TODO Don't keep re-computing this; it's expensive
  const { passedRecordings, failedRecordings, flakyRecordings } = useMemo(
    () => groupRecordings(summary.results.recordings),
    [summary.results.recordings]
  );

  return (
    <>
      <div className="relative mb-2 border-b border-themeBorder bg-bodyBgcolor p-2">
        <input
          className="w-full appearance-none rounded border-none bg-gray-900 text-xs focus:outline-none focus:ring"
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
      <div className="no-scrollbar flex flex-col overflow-y-auto">
        <TestStatusGroup
          filterByText={filterByTextDeferred}
          label="Failed"
          recordingGroup={failedRecordings}
        />
        <TestStatusGroup
          filterByText={filterByTextDeferred}
          label="Flaky"
          recordingGroup={flakyRecordings}
        />
        <TestStatusGroup
          filterByText={filterByTextDeferred}
          label="Passed"
          recordingGroup={passedRecordings}
        />
      </div>
    </>
  );
}

function TestStatusGroup({
  filterByText,
  label,
  recordingGroup,
}: {
  filterByText: string;
  label: string;
  recordingGroup: RecordingGroup;
}) {
  const [expanded, setExpanded] = useState(true);

  const tree = useFileNameTree(recordingGroup, filterByText);

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
  const { name, recordings } = fileNode;

  const [expanded, setExpanded] = useState(true);

  const onClick = () => setExpanded(!expanded);

  return (
    <>
      <div
        className={`flex cursor-pointer items-center gap-2 truncate  py-2  pr-4 ${styles.libraryRow}`}
        onClick={onClick}
        style={{
          paddingLeft: `${depth * 1}rem`,
        }}
      >
        <Icon className="h-5 w-5 shrink-0" type="file" />
        <div className="truncate">{name}</div>
        {!expanded && <div className="text-xs text-bodySubColor">({recordings.length} tests)</div>}
      </div>
      <Offscreen mode={expanded ? "visible" : "hidden"}>
        {recordings.map(recording => (
          <TestResultListItem
            depth={depth + 1}
            key={recording.id}
            label={label}
            recording={recording}
            secondaryBadgeCount={/* index > 0 ? index + 1 : null */ null}
          />
        ))}
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
              />
            );
          }
        })}
      </Offscreen>
    </>
  );
}

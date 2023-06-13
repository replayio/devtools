import { ReactElement, useContext, useMemo, useState } from "react";

import { Recording } from "shared/graphql/types";
import Icon from "ui/components/shared/Icon";
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
            filename="chevron"
            className={`${
              expanded ? "bg-iconColor" : "rotate-90"
            } rotate duration-140 bg-iconColor transition ease-out`}
            size="small"
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
  const sortedEntries = useMemo(() => {
    const entries = Array.from(Object.entries(recordingGroup.fileNameToRecordings));
    // Sort by filename ascending
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [recordingGroup.fileNameToRecordings]);

  return sortedEntries.map(([fileName, recordings]) => (
    <TestFileGroup key={fileName} fileName={fileName} label={label} recordings={recordings} />
  )) as any;
}

function TestFileGroup({
  fileName,
  label,
  recordings,
}: {
  fileName: string;
  label: string;
  recordings: Recording[];
}) {
  return recordings.map((recording, index) => (
    <TestResultListItem
      key={recording.id}
      label={label}
      recording={recording}
      secondaryBadgeCount={index > 0 ? index + 1 : null}
    />
  )) as any;
}

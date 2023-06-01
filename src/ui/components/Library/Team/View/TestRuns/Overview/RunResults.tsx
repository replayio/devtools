import { useContext, useMemo, useState } from "react";

import { Recording } from "shared/graphql/types";
import Icon from "ui/components/shared/Icon";
import { RecordingGroup, groupRecordings } from "ui/utils/testRuns";

import { TestResultListItem } from "./TestResultListItem";
import { TestRunOverviewContext } from "./TestRunOverviewContainerContextType";
import styles from "../../../../Library.module.css";

export function RunResults() {
  const testSuiteRun = useContext(TestRunOverviewContext).testSuiteRun!;

  // TODO Don't keep re-computing this; it's expensive
  const { passedRecordings, failedRecordings, flakyRecordings } = useMemo(
    () => groupRecordings(testSuiteRun.results.recordings),
    [testSuiteRun.results.recordings]
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
        className={` top-0 flex grow flex-row p-2 pl-4 font-medium hover:cursor-pointer ${styles.libraryRowHeader}`}
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
      {expanded && <Expanded label={label} recordingGroup={recordingGroup} />}
    </div>
  );
}

function Expanded({ label, recordingGroup }: { label: string; recordingGroup: RecordingGroup }) {
  const recordings = useMemo(() => {
    const recordings: Recording[] = [];
    for (let fileName in recordingGroup.fileNameToRecordings) {
      recordings.push(...recordingGroup.fileNameToRecordings[fileName]);
    }
    return recordings;
  }, [recordingGroup]);

  return recordings.map(recording => (
    <TestResultListItem key={recording.id} label={label} recording={recording} />
  )) as any;
}

import { orderBy } from "lodash";
import { useContext, useState } from "react";
import { TestResultListItem } from "./TestResultListItem";
import { OverviewContext } from "./OverviewContainer";
import { Recording } from "ui/types";

export function RunResults() {
  const testRun = useContext(OverviewContext).testRun!;

  const sortedRecordings = orderBy(testRun.recordings, "date", "desc");
  const passedRecordings = sortedRecordings.filter(r => r.metadata.test?.result === "passed");
  const failedRecordings = sortedRecordings.filter(r => r.metadata.test?.result === "failed");

  return (
    <div className="flex flex-col overflow-y-auto">
      <TestStatusGroup recordings={failedRecordings} label="Failed Tests" />
      <TestStatusGroup recordings={passedRecordings} label="Passed Tests" />
    </div>
  );
}

function TestStatusGroup({ recordings, label }: { recordings: Recording[]; label: string }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col">
      <div
        className="sticky top-0 p-2 px-4 font-medium bg-white border-b"
        onClick={() => setExpanded(!expanded)}
      >
        {label} ({recordings.length})
      </div>
      {expanded && recordings.map((r, i) => <TestResultListItem recording={r} key={i} />)}
    </div>
  );
}

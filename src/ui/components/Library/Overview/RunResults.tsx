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
    <div className="flex flex-col">
      <TestStatusGroup recordings={failedRecordings} label="Failed" />
      <TestStatusGroup recordings={passedRecordings} label="Passed" />
    </div>
  );
}

function TestStatusGroup({ recordings, label }: { recordings: Recording[]; label: string }) {
  const [expanded, setExpanded] = useState(true);
  const count = recordings.length;
  if (count == 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div
        className=" sticky top-0 bg-gray-100 p-2 pl-3 font-bold hover:cursor-pointer hover:bg-gray-200"
        onClick={() => setExpanded(!expanded)}
      >
        {count} {label} Test{count > 1 ? "s" : ""}
      </div>
      {expanded && recordings.map((r, i) => <TestResultListItem recording={r} key={i} />)}
    </div>
  );
}

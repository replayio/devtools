import orderBy from "lodash/orderBy";
import { useContext, useState } from "react";
import { TestResultListItem } from "./TestResultListItem";
import { OverviewContext } from "./OverviewContainer";
import { Recording } from "ui/types";
import styles from "../Library.module.css";
import classNames from "classnames";
import Icon from "ui/components/shared/Icon";

export function RunResults() {
  const testRun = useContext(OverviewContext).testRun!;

  const sortedRecordings = orderBy(testRun.recordings, "date", "desc");
  const passedRecordings = sortedRecordings.filter(r => r.metadata.test?.result === "passed");
  const failedRecordings = sortedRecordings.filter(r => r.metadata.test?.result === "failed");

  return (
    <div className="flex flex-col overflow-y-auto">
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
        className={` top-0 flex grow flex-row p-2 pl-4 font-medium hover:cursor-pointer ${styles.libraryRowHeader}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="grow">
          {count} {label} Test{count > 1 ? "s" : ""}
        </div>
        <div className="flex">
          <Icon
            filename="chevron"
            className={`${expanded ? "bg-iconColor" : "rotate-90"} bg-iconColor`}
            size="small"
          />
        </div>
      </div>
      {expanded && recordings.map((r, i) => <TestResultListItem recording={r} key={i} />)}
    </div>
  );
}

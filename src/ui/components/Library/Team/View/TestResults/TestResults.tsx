import sortBy from "lodash/sortBy";
import { useMemo, useState } from "react";

import { Recording } from "shared/graphql/types";
import { SecondaryButton } from "ui/components/shared/Button";

import { RecordingsError } from "../Recordings/RecordingsError";
import TestResultRow from "./TestResultRow";
import styles from "../../../Library.module.css";

export function TestResults({ recordings }: { recordings: Recording[] }) {
  const [showMore, toggleShowMore] = useState(false);

  const shownRecordings = useMemo(() => {
    const sortedRecordings = sortBy(recordings, recording => {
      const ascOrder = false;
      const order = ascOrder ? 1 : -1;
      return order * new Date(recording.date).getTime();
    });
    return showMore ? sortedRecordings : sortedRecordings.slice(0, 100);
  }, [recordings, showMore]);

  if (!recordings.length) {
    return <RecordingsError />;
  }

  return (
    <div
      className={`no-scrollbar mb-1 flex flex-col overflow-y-auto rounded-t-xl border-b border-chrome text-sm ${styles.recordingList}`}
    >
      {shownRecordings.map((r, i) => (
        <TestResultRow key={i} recording={r} />
      ))}
      {!showMore && recordings.length > 100 && (
        <div className="flex justify-center p-4">
          <SecondaryButton className="" color="blue" onClick={() => toggleShowMore(!showMore)}>
            Show More
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}

import { RecordingId } from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import { memo, useMemo, useState } from "react";

import { Button } from "replay-next/components/Button";
import { Recording } from "shared/graphql/types";

import RecordingRow from "./RecordingListItem/RecordingListItem";
import { RecordingsError } from "./RecordingsError";
import styles from "../../../Library.module.css";

const NUM_ROWS_PER_PAGE = 50;

export const Recordings = memo(function Recordings({
  recordings,
  selectedIds,
  setSelectedIds,
  isEditing,
}: {
  recordings: Recording[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  isEditing: boolean;
}) {
  const [showMore, toggleShowMore] = useState(false);

  const shownRecordings = useMemo(() => {
    const sortedRecordings = sortBy(recordings, recording => {
      const ascOrder = false;
      const order = ascOrder ? 1 : -1;
      return order * new Date(recording.date).getTime();
    });
    return showMore ? sortedRecordings : sortedRecordings.slice(0, NUM_ROWS_PER_PAGE);
  }, [recordings, showMore]);

  const addSelectedId = (recordingId: RecordingId) => setSelectedIds([...selectedIds, recordingId]);
  const removeSelectedId = (recordingId: RecordingId) =>
    setSelectedIds(selectedIds.filter(id => id !== recordingId));

  if (!recordings.length) {
    return <RecordingsError />;
  }

  return (
    <div
      className={`flex flex-col space-y-0 overflow-y-auto rounded-md text-sm shadow-md ${styles.recordingList}`}
    >
      {shownRecordings.map((r, i) => (
        <RecordingRow
          key={i}
          recording={r}
          selected={selectedIds.includes(r.id)}
          {...{ addSelectedId, removeSelectedId, isEditing }}
        />
      ))}
      {!showMore && recordings.length > NUM_ROWS_PER_PAGE && (
        <div className="flex justify-center p-4">
          <Button onClick={() => toggleShowMore(!showMore)}>Show More</Button>
        </div>
      )}
    </div>
  );
});

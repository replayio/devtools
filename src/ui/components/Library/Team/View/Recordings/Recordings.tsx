import { RecordingId } from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import { useMemo, useState } from "react";

import { Recording } from "shared/graphql/types";
import { SecondaryButton } from "ui/components/shared/Button";

import RecordingRow from "./RecordingListItem/RecordingListItem";
import { RecordingsError } from "./RecordingsError";
import styles from "../../../Library.module.css";

export function Recordings({
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
    return showMore ? sortedRecordings : sortedRecordings.slice(0, 100);
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

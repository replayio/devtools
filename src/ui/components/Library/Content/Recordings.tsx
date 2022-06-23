import { RecordingId } from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import { ReactNode, useContext, useMemo, useState } from "react";
import { PrimaryButton, SecondaryButton } from "ui/components/shared/Button";
import { Recording } from "ui/types";
import { isReplayBrowser } from "ui/utils/environment";
import RecordingRow from "../RecordingRow";
import styles from "../Library.module.css";
import { LibraryContext, View } from "../useFilters";
import ResultRow from "../ResultRow";

function RecordingsError() {
  const { filter, setAppliedText } = useContext(LibraryContext);
  let msg: string | ReactNode;

  if (filter) {
    msg = (
      <>
        <div>No recordings found</div>
        <PrimaryButton color="blue" onClick={() => setAppliedText("")}>
          Clear filters
        </PrimaryButton>
      </>
    );
  } else if (isReplayBrowser()) {
    msg = "Please open a new tab and press the blue record button to record a Replay";
  } else {
    msg = "👋 This is where your replays will go!";
  }

  return (
    <section
      className={`flex flex-grow flex-col items-center justify-center space-y-1 text-lg ${styles.recordingsBackground}`}
    >
      {msg}
    </section>
  );
}

export function Recordings({
  recordings,
  selectedIds,
  setSelectedIds,
  isEditing,
  view,
}: {
  recordings: Recording[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  isEditing: boolean;
  view: View;
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
      className={`recording-list flex flex-col space-y-1 overflow-y-auto rounded-md text-sm shadow-md ${styles.recordingList}`}
    >
      {shownRecordings.map((r, i) =>
        view === "recordings" ? (
          <RecordingRow
            key={i}
            recording={r}
            selected={selectedIds.includes(r.id)}
            {...{ addSelectedId, removeSelectedId, isEditing }}
          />
        ) : (
          <ResultRow
            key={i}
            recording={r}
            selected={selectedIds.includes(r.id)}
            {...{ addSelectedId, removeSelectedId, isEditing }}
          />
        )
      )}
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

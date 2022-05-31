import { RecordingId } from "@replayio/protocol";
import { sortBy } from "lodash";
import { useMemo, useState } from "react";
import { SecondaryButton } from "ui/components/shared/Button";
import { Recording } from "ui/types";
import { isReplayBrowser } from "ui/utils/environment";
import RecordingRow from "../RecordingRow";
import styles from "../Library.module.css";

function getErrorText() {
  if (isReplayBrowser()) {
    return "Please open a new tab and press the blue record button to record a Replay";
  }

  return <DownloadLinks />;
}

function DownloadLinks() {
  const [clicked, setClicked] = useState(false);

  if (clicked) {
    return (
      <div className="flex flex-col space-y-6" style={{ maxWidth: "24rem" }}>
        <div>Download started.</div>
        <div>{`Once the download is finished, open the Replay Browser installer to install Replay`}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 text-sm" style={{ maxWidth: "24rem" }}>
      <div className="text-lg">{`👋 This is where your replays will go!`}</div>
    </div>
  );
}

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
    const errorText = getErrorText();

    return (
      <>
        <section
          className={`grid flex-grow items-center justify-center text-sm ${styles.recordingsBackground}`}
        >
          <span>{errorText}</span>
        </section>
      </>
    );
  }

  return (
    <>
      <div
        className={`recording-list flex flex-col overflow-y-auto rounded-md text-sm shadow-md ${styles.recordingList}`}
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
    </>
  );
}

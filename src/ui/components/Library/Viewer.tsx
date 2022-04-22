import React, { useState, useMemo } from "react";
import { Recording } from "ui/types";
import { RecordingId } from "@recordreplay/protocol";
import BatchActionDropdown from "./BatchActionDropdown";
import { isReplayBrowser } from "ui/utils/environment";
import { PrimaryButton, SecondaryButton } from "../shared/Button";
import { LibraryFilters } from "./Library";
import RecordingRow from "./RecordingRow";
import ViewerHeader, { ViewerHeaderLeft } from "./ViewerHeader";
import sortBy from "lodash/sortBy";
import styles from "./Library.module.css";
import { useSelector } from "react-redux";
import { getWorkspaceId } from "ui/reducers/app";
import TeamTrialEnd from "./TeamTrialEnd";

const subStringInString = (subString: string, string: string | null) => {
  if (!string) {
    return false;
  }

  return string.toLowerCase().includes(subString.toLowerCase());
};

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

const filterRecordings = (recordings: Recording[], filters: LibraryFilters) => {
  const { searchString, qualifiers } = filters;
  let filteredRecordings = recordings;

  filteredRecordings = searchString
    ? recordings.filter(
        r => subStringInString(searchString, r.url) || subStringInString(searchString, r.title)
      )
    : recordings;
  filteredRecordings =
    qualifiers.target && qualifiers.target === "target:node"
      ? filteredRecordings.filter(r => !r.user)
      : filteredRecordings;
  filteredRecordings =
    (qualifiers.created && new Date(qualifiers.created))
      ? filteredRecordings.filter(
          r => new Date(r.date).getTime() > new Date(qualifiers.created!).getTime()
        )
      : filteredRecordings;

  return filteredRecordings;
};

export default function Viewer({
  recordings,
  workspaceName,
  filters,
}: {
  recordings: Recording[];
  workspaceName: string | React.ReactNode;
  filters: LibraryFilters;
}) {
  const filteredRecordings = filterRecordings(recordings, filters);

  return (
    <div
      className={`flex flex-grow flex-col space-y-5 overflow-hidden bg-gray-100 px-8 py-6 ${styles.libraryWrapper}`}
    >
      <ViewerContent {...{ workspaceName }} recordings={filteredRecordings} />
    </div>
  );
}

function ViewerContent({
  recordings,
  workspaceName,
}: {
  recordings: Recording[];
  workspaceName: string | React.ReactNode;
}) {
  const currentWorkspaceId = useSelector(getWorkspaceId);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMore, toggleShowMore] = useState(false);

  console.log(recordings);

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
  const handleDoneEditing = () => {
    setSelectedIds([]);
    setIsEditing(false);
  };

  const HeaderLeft = (
    <ViewerHeaderLeft>
      <span className={styles.workspaceName}>{workspaceName}</span>
      <span className={styles.workspaceName}>
        {recordings.length != 0 ? <>({recordings.length})</> : <></>}
      </span>
    </ViewerHeaderLeft>
  );

  if (!recordings.length) {
    const errorText = getErrorText();

    return (
      <>
        <ViewerHeader>{HeaderLeft}</ViewerHeader>
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
      <ViewerHeader>
        {HeaderLeft}
        <div className="flex flex-row items-center space-x-3">
          {currentWorkspaceId ? <TeamTrialEnd currentWorkspaceId={currentWorkspaceId} /> : null}
          {isEditing ? (
            <>
              <BatchActionDropdown
                setSelectedIds={setSelectedIds}
                selectedIds={selectedIds}
                recordings={shownRecordings}
              />
              <PrimaryButton color="blue" onClick={handleDoneEditing}>
                Done
              </PrimaryButton>
            </>
          ) : (
            <SecondaryButton
              className={styles.editButton}
              color="blue"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </SecondaryButton>
          )}
        </div>
      </ViewerHeader>
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

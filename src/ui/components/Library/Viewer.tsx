import { RecordingId } from "@replayio/protocol";

import BatchActionDropdown from "./BatchActionDropdown";

import { isReplayBrowser } from "ui/utils/environment";
import { PrimaryButton, SecondaryButton } from "../shared/Button";
import ViewerHeader, { ViewerHeaderLeft } from "./ViewerHeader";
import MaterialIcon from "ui/components/shared/MaterialIcon";

import sortBy from "lodash/sortBy";
import React, { useState, useMemo, useContext } from "react";
import { useSelector } from "react-redux";
import { getWorkspaceId } from "ui/reducers/app";
import { Recording } from "ui/types";

import styles from "./Library.module.css";
import RecordingRow from "./RecordingRow";
import TeamTrialEnd from "./TeamTrialEnd";

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

export default function Viewer({
  recordings,
  workspaceName,
  tests,
}: {
  recordings: Recording[];
  workspaceName: string | React.ReactNode;
  tests: any[];
}) {
  return (
    <div
      className={`flex flex-grow flex-col space-y-5 overflow-hidden bg-gray-100 px-8 py-6 ${styles.libraryWrapper}`}
    >
      <ViewerContent workspaceName={workspaceName} recordings={recordings} tests={tests} />
    </div>
  );
}

function ViewerContent({
  recordings,
  tests,
  workspaceName,
}: {
  tests: any[];
  recordings: Recording[];
  workspaceName: string | React.ReactNode;
}) {
  const currentWorkspaceId = useSelector(getWorkspaceId);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMore, toggleShowMore] = useState(false);
  const [showTests, setShowTests] = useState(false);

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
          <button onClick={() => setShowTests(!showTests)}>Toggle tests view</button>
        </div>
      </ViewerHeader>
      <div
        className={`recording-list flex flex-col overflow-y-auto rounded-md text-sm shadow-md ${styles.recordingList}`}
      >
        {showTests && tests ? (
          <>
            {tests.map((t, i) => (
              <TestRow path={t.path} count={t.count} key={i} />
            ))}
          </>
        ) : (
          shownRecordings.map((r, i) => (
            <RecordingRow
              key={i}
              recording={r}
              selected={selectedIds.includes(r.id)}
              {...{ addSelectedId, removeSelectedId, isEditing }}
            />
          ))
        )}
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

function TestRow({ path, count }: { path: string; count: number }) {
  return (
    <div className="flex flex-row cursor-pointer border-b border-themeBorder flex-grow overflow-hidden py-3 px-4 items-center space-x-4 justify-between">
      <div className="flex space-x-4 items-center">
        <MaterialIcon iconSize="2xl">description</MaterialIcon>
        <div className="flex flex-col">
          <div>{path}</div>
          <div>{count} replay(s)</div>
        </div>
      </div>
      <div className="flex flex-row space-x-1 h-5">
        {new Array(10).fill("").map((v, i) => (
          <div
            key={i}
            className={`h-full w-2 ${Math.random() > 0.2 ? "bg-green-500" : "bg-red-500"}`}
          />
        ))}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Recording } from "ui/types";
import { RecordingId } from "@recordreplay/protocol";
import BatchActionDropdown from "./BatchActionDropdown";
import { isReplayBrowser } from "ui/utils/environment";
import { PrimaryButton, SecondaryButton } from "../shared/Button";
import RecordingRow from "./RecordingRow";
import ViewerHeader, { ViewerHeaderLeft } from "./ViewerHeader";
import sortBy from "lodash/sortBy";
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
    <div className="flex flex-col space-y-6 text-default" style={{ maxWidth: "24rem" }}>
      <div className="text-lg">{`👋 This is where your replays will go!`}</div>
    </div>
  );
}

export default function Viewer({
  recordings,
  workspaceName,
  searchString,
}: {
  recordings: Recording[];
  workspaceName: string | React.ReactNode;
  searchString: string;
}) {
  const filteredRecordings = searchString
    ? recordings.filter(
        r => subStringInString(searchString, r.url) || subStringInString(searchString, r.title)
      )
    : recordings;

  return (
    <div className="flex flex-col flex-grow px-8 py-6 bg-gray-100 space-y-5 overflow-hidden">
      <ViewerContent {...{ workspaceName, searchString }} recordings={filteredRecordings} />
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
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const addSelectedId = (recordingId: RecordingId) => setSelectedIds([...selectedIds, recordingId]);
  const removeSelectedId = (recordingId: RecordingId) =>
    setSelectedIds(selectedIds.filter(id => id !== recordingId));
  const handleDoneEditing = () => {
    setSelectedIds([]);
    setIsEditing(false);
  };

  const HeaderLeft = (
    <ViewerHeaderLeft>
      <span>{workspaceName}</span>
      <span>{recordings.length != 0 ? <>({recordings.length})</> : <></>}</span>
    </ViewerHeaderLeft>
  );

  if (!recordings.length) {
    const errorText = getErrorText();

    // if (searchString) {
    //   errorText = "No replays found, please expand your search";
    // } else {
    //   errorText = getErrorText();
    // }

    return (
      <>
        <ViewerHeader>{HeaderLeft}</ViewerHeader>
        <section className="grid items-center justify-center flex-grow text-default bg-gray-100">
          <span className="text-gray-500">{errorText}</span>
        </section>
      </>
    );
  }

  let sortedRecordings = sortBy(recordings, recording => {
    const ascOrder = false;
    const order = ascOrder ? 1 : -1;
    return order * new Date(recording.date).getTime();
  });

  return (
    <>
      <ViewerHeader>
        {HeaderLeft}
        <div className="flex flex-row space-x-3 items-center">
          <TeamTrialEnd />
          {isEditing ? (
            <>
              <BatchActionDropdown setSelectedIds={setSelectedIds} selectedIds={selectedIds} />
              <PrimaryButton className="bg-white" color="blue" onClick={handleDoneEditing}>
                Done
              </PrimaryButton>
            </>
          ) : (
            <SecondaryButton className="bg-white" color="blue" onClick={() => setIsEditing(true)}>
              Edit
            </SecondaryButton>
          )}
        </div>
      </ViewerHeader>
      <div className="flex flex-col rounded-md shadow-md bg-white text-default overflow-y-auto recording-list">
        {sortedRecordings.map((r, i) => (
          <RecordingRow
            key={i}
            recording={r}
            selected={selectedIds.includes(r.id)}
            {...{ addSelectedId, removeSelectedId, isEditing }}
          />
        ))}
      </div>
    </>
  );
}

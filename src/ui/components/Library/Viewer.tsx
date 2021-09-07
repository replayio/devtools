import React, { useState } from "react";
import { Recording } from "ui/types";
import formatDate from "date-fns/format";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { useHistory } from "react-router-dom";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import hooks from "ui/hooks";
import { Redacted } from "../Redacted";
import { RecordingId } from "@recordreplay/protocol";
import ItemDropdown from "./ItemDropdown";
import BatchActionDropdown from "./BatchActionDropdown";
import { isReplayBrowser } from "ui/utils/environment";
import { PrimaryButton } from "../shared/Button";

function getDurationString(durationMs: number) {
  const seconds = Math.round(durationMs / 1000);
  return `${seconds} sec`;
}

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
      <div>{`There's nothing here yet. To create your first replay, you first need to download the Replay Browser`}</div>
      <div className="grid gap-3 grid-cols-2">
        <a
          href="https://replay.io/downloads/replay.dmg"
          className={
            "w-full text-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
          }
          onClick={() => setClicked(true)}
        >
          Download for Mac
        </a>
        <a
          href="https://replay.io/downloads/linux-replay.tar.bz2"
          className={
            "w-full text-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
          }
          onClick={() => setClicked(true)}
        >
          Download for Linux
        </a>
      </div>
    </div>
  );
}

export default function Viewer({
  recordings,
  workspaceName,
  searchString,
}: {
  recordings: Recording[];
  workspaceName: string;
  searchString: string;
}) {
  if (!recordings.length) {
    const errorText = getErrorText();

    // if (searchString) {
    //   errorText = "No replays found, please expand your search";
    // } else {
    //   errorText = getErrorText();
    // }

    return (
      <section className="grid items-center justify-center flex-grow text-sm bg-gray-100">
        <span className="text-gray-500">{errorText}</span>
      </section>
    );
  }

  const filteredRecordings = recordings.filter(
    r => subStringInString(searchString, r.url) || subStringInString(searchString, r.title)
  );

  return (
    <div className="flex flex-col flex-grow px-8 py-6 bg-gray-100 space-y-5 overflow-auto">
      <ViewerContent {...{ workspaceName, searchString }} recordings={filteredRecordings} />
    </div>
  );
}

function ViewerContent({
  recordings,
  workspaceName,
}: {
  recordings: Recording[];
  workspaceName: string;
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

  return (
    <>
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row space-x-2 text-2xl font-semibold">
          <Redacted>{workspaceName}</Redacted>
          <span>({recordings.length})</span>
        </div>
        <div className="flex flex-row space-x-2">
          {isEditing ? (
            <>
              <BatchActionDropdown setSelectedIds={setSelectedIds} selectedIds={selectedIds} />
              <PrimaryButton color="blue" onClick={handleDoneEditing}>
                Done
              </PrimaryButton>
            </>
          ) : (
            <PrimaryButton color="blue" onClick={() => setIsEditing(true)}>
              Edit
            </PrimaryButton>
          )}
        </div>
      </div>
      <div className="overflow-auto rounded-md shadow-md">
        <table className="w-full relative">
          <thead className="bg-gray-50 font-normal text-xs uppercase text-gray-500 sticky top-0 w-full">
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4"></th>
              <th className="py-3 px-6 text-left">Title</th>
              <th className="py-3 px-6">Length</th>
              <th className="py-3 px-6">Created</th>
              <th className="py-3 px-6">Privacy</th>
              <th className="py-3 px-6">Owner</th>
              <th className="py-3 px-6">Activity</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="bg-white text-sm text-gray-500 overflow-hidden">
            {recordings.map((r, i) => (
              <RecordingRow
                key={i}
                recording={r}
                selected={selectedIds.includes(r.id)}
                {...{ addSelectedId, removeSelectedId, isEditing }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function getRelativeDate(date: string) {
  let content = formatDistanceToNow(new Date(date), { addSuffix: true });

  const daysSince = (new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24);

  // Show relative time if under 3 days, otherwise, use the template below.
  if (daysSince > 2) {
    content = formatDate(new Date(date), "M/d/yyyy");
  }

  return content;
}

function RecordingRow({
  recording,
  isEditing,
  selected,
  addSelectedId,
  removeSelectedId,
}: {
  recording: Recording;
  isEditing: boolean;
  selected: boolean;
  addSelectedId: (recordingId: RecordingId) => void;
  removeSelectedId: (recordingId: RecordingId) => void;
}) {
  const history = useHistory();
  const { userId, loading } = hooks.useGetUserId();

  if (loading) {
    return null;
  }

  const isOwner = userId == recording.user?.id;

  const onNavigate: React.MouseEventHandler = event => {
    let url = `/recording/${recording.id}`;
    const isTesting = new URL(window.location.href).searchParams.get("e2etest");

    if (isTesting) {
      url += `?e2etest=true`;
    }

    if (event.metaKey) {
      return window.open(url);
    }
    history.push(url);
  };
  const toggleChecked = () => {
    if (selected) {
      removeSelectedId(recording.id);
    } else {
      addSelectedId(recording.id);
    }
  };
  const onClick = (e: React.MouseEvent) => {
    if (isEditing) {
      toggleChecked();
    } else {
      onNavigate(e);
    }
  };

  return (
    <tr
      className="group border-b border-gray-200 hover:bg-gray-50 transition duration-200 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <td className="text-center">
        {isEditing ? (
          <input
            type="checkbox"
            onClick={e => e.stopPropagation()}
            onChange={toggleChecked}
            checked={selected}
          />
        ) : null}
      </td>
      <td className="py-3 px-6 text-left overflow-hidden">
        <Redacted>
          <div className="flex flex-row items-center space-x-4 overflow-hidden">
            <div className="bg-gray-100 rounded-sm w-16 h-9">
              <ItemScreenshot recordingId={recording.id} />
            </div>

            <div className="flex flex-col overflow-hidden" style={{ maxWidth: "200px" }}>
              <div className="text-gray-900 font-bold overflow-hidden overflow-ellipsis whitespace-pre">
                {recording.title}
              </div>
              <div className="text-gray-400 overflow-hidden overflow-ellipsis whitespace-pre">
                {recording.url}
              </div>
            </div>
          </div>
        </Redacted>
      </td>
      <td className="text-center">{getDurationString(recording.duration)}</td>
      <td className="text-center">{getRelativeDate(recording.date)}</td>
      <td className="text-center">{recording.private ? "Private" : "Public"}</td>
      <td className="text-center overflow-hidden overflow-ellipsis whitespace-pre">
        {recording.user ? recording.user.name : "Unknown"}
      </td>
      <td className="text-center">{`${recording.comments.length} 💬`}</td>
      <td className="text-center opacity-0 group-hover:opacity-100">
        {isOwner && <ItemOptions recording={recording} />}
      </td>
    </tr>
  );
}

function ItemScreenshot({ recordingId }: { recordingId: RecordingId }) {
  const { screenData } = hooks.useGetRecordingPhoto(recordingId);
  return (
    <Redacted>
      <div>
        {screenData && (
          <img className="h-9 w-full object-contain" src={screenData} alt="recording screenshot" />
        )}
      </div>
    </Redacted>
  );
}

function ItemOptions({ recording }: { recording: Recording }) {
  const Panel = <ItemDropdown recording={recording} />;

  return (
    <div className="more" onClick={e => e.stopPropagation()}>
      <Dropdown
        panel={Panel}
        icon={<div className="img dots-horizontal" />}
        panelStyles={{ top: "28px", right: "0px" }}
      />
    </div>
  );
}

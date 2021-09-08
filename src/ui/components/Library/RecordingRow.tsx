import React from "react";
import { Recording } from "ui/types";
import { useHistory } from "react-router-dom";
import formatDate from "date-fns/format";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import LazyLoad from "react-lazyload";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import hooks from "ui/hooks";
import { Redacted } from "../Redacted";
import { RecordingId } from "@recordreplay/protocol";
import ItemDropdown from "./ItemDropdown";

export function getDurationString(durationMs: number) {
  const seconds = Math.round(durationMs / 1000);
  return `${seconds} sec`;
}

export function getRelativeDate(date: string) {
  let content = formatDistanceToNow(new Date(date), { addSuffix: true });

  const daysSince = (new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24);

  // Show relative time if under 3 days, otherwise, use the template below.
  if (daysSince > 2) {
    content = formatDate(new Date(date), "M/d/yyyy");
  }

  return content;
}

export default function RecordingRow({
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
              <LazyLoad height={36} scrollContainer=".recording-list" once>
                <ItemScreenshot recordingId={recording.id} />
              </LazyLoad>
            </div>

            <div className="flex flex-col overflow-hidden" style={{ maxWidth: "200px" }}>
              <div className="text-gray-900 overflow-hidden overflow-ellipsis whitespace-pre">
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

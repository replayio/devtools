import React, { MouseEvent } from "react";
import { Recording } from "ui/types";
import formatDate from "date-fns/format";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import LazyLoad from "react-lazyload";
import hooks from "ui/hooks";
import { Redacted } from "../Redacted";
import { RecordingId } from "@recordreplay/protocol";
import RecordingOptionsDropdown from "./RecordingOptionsDropdown";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { getDisplayedUrl } from "ui/utils/environment";
import { getRecordingURL } from "ui/hooks/recordings";

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

function RowWrapper({
  children,
  isEditing,
  recording,
  onClick,
}: {
  children: React.ReactNode;
  isEditing: boolean;
  recording: Recording;
  onClick: () => void;
}) {
  return isEditing ? (
    <div onClick={onClick}> {children}</div>
  ) : (
    <a href={getRecordingURL(recording)} style={{ color: "inherit", textDecoration: "inherit" }}>
      {children}
    </a>
  );
}

type RecordingRowProps = PropsFromRedux & {
  recording: Recording;
  isEditing: boolean;
  selected: boolean;
  addSelectedId: (recordingId: RecordingId) => void;
  removeSelectedId: (recordingId: RecordingId) => void;
};

function RecordingRow({
  recording,
  isEditing,
  selected,
  removeSelectedId,
  addSelectedId,
}: RecordingRowProps) {
  const { userId, loading } = hooks.useGetUserId();
  const isOwner = userId == recording.user?.id;

  const toggleChecked = () => {
    if (selected) {
      removeSelectedId(recording.id);
    } else {
      addSelectedId(recording.id);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <RowWrapper recording={recording} isEditing={isEditing} onClick={toggleChecked}>
      <div className="group border-b border-gray-200 hover:bg-gray-50 cursor-pointer flex flex-row">
        <div className="py-3 px-4 overflow-hidden whitespace-pre overflow-ellipsis w-12 flex-shrink-0 flex flex-row items-center">
          {isEditing && isOwner ? (
            <input
              type="checkbox"
              onClick={e => e.stopPropagation()}
              onChange={toggleChecked}
              checked={selected}
              className="focus:primaryAccentHover h-4 w-4 text-primaryAccent border-gray-300 rounded"
            />
          ) : null}
        </div>
        <div className="py-3 px-1 overflow-hidden whitespace-pre overflow-ellipsis flex-grow">
          <div className="flex flex-row items-center space-x-4 overflow-hidden">
            <div className="bg-gray-100 rounded-sm w-16 h-9 flex-shrink-0 overflow-hidden">
              <LazyLoad height={36} scrollContainer=".recording-list" once>
                <ItemScreenshot recordingId={recording.id} />
              </LazyLoad>
            </div>

            <div className="flex flex-col overflow-hidden space-y-0.5">
              <div className="overflow-hidden overflow-ellipsis whitespace-pre">
                {recording.title || <span className="italic">Untitled</span>}
              </div>
              <div className="flex flex-row space-x-4 text-gray-400 font-light">
                <div
                  className="flex flex-row items-center overflow-hidden whitespace-pre overflow-ellipsis space-x-1"
                  style={{ minWidth: "5rem" }}
                >
                  <img src="/images/timer.svg" className="w-3" />
                  <span>{getDurationString(recording.duration)}</span>
                </div>
                <div
                  className="flex flex-row items-center overflow-hidden whitespace-pre overflow-ellipsis space-x-1"
                  style={{ minWidth: "6rem" }}
                >
                  <img src="/images/today.svg" className="w-3" />
                  <span>{getRelativeDate(recording.date)}</span>
                </div>
                <div className="text-gray-400 font-light overflow-hidden overflow-ellipsis whitespace-pre">
                  {getDisplayedUrl(recording.url)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-3 px-3 text-right overflow-hidden whitespace-nowrap overflow-ellipsis min-w-min w-20 flex-shrink-0 my-auto">
          {recording.private ? "Private" : "Public"}
        </div>
        <div className="py-3 px-3 overflow-hidden whitespace-nowrap min-w-0 w-36 overflow-ellipsis flex-shrink-0 my-auto">
          {recording.user ? recording.user.name : "Unknown"}
        </div>
        <div className="py-3 px-3 overflow-hidden whitespace-pre w-12 flex-shrink-0 flex flex-row items-center">
          {recording.comments.length ? (
            <div className="inline-block">
              <div className="flex flex-row space-x-1">
                <span>{recording.comments.length}</span>
                <img src="/images/comment-outline.svg" className="w-3" />
              </div>
            </div>
          ) : (
            <div className="py-3 px-3 overflow-hidden whitespace-nowrap overflow-ellipsis w-12 flex-shrink-0 flex flex-row items-center" />
          )}
        </div>
        <div
          className="py-3 pr-4 flex-shrink-0 flex flex-row items-center justify-center w-6 relative"
          onClick={e => e.stopPropagation()}
        >
          {isOwner && !isEditing ? <RecordingOptionsDropdown {...{ recording }} /> : null}
        </div>
      </div>
    </RowWrapper>
  );
}

function ItemScreenshot({ recordingId }: { recordingId: RecordingId }) {
  const { screenData } = hooks.useGetRecordingPhoto(recordingId);
  return (
    <Redacted>
      <div>{screenData && <img className="h-9 w-full object-contain" src={screenData} />}</div>
    </Redacted>
  );
}

const connector = connect(() => ({}), { loadReplayPrefs: actions.loadReplayPrefs });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(RecordingRow);

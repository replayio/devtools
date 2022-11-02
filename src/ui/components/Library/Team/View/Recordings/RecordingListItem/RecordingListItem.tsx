import { RecordingId } from "@replayio/protocol";
import formatDate from "date-fns/format";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import React from "react";
import LazyLoad from "react-lazyload";

import hooks from "ui/hooks";
import { useGetUserPermissions } from "ui/hooks/users";
import { Recording } from "ui/types";
import { getDisplayedUrl } from "ui/utils/environment";
import { getRecordingURL } from "ui/utils/recording";

import { Redacted } from "../../../../../Redacted";
import RecordingOptionsDropdown from "./RecordingOptionsDropdown";
import { TestResult } from "./TestResult";
import styles from "../../../../Library.module.css";

export function getDurationString(durationMs: number | null | undefined) {
  if (typeof durationMs !== "number") {
    return "";
  }
  const seconds = Math.round(durationMs / 1000);
  return `${seconds} sec`;
}

function shortenRelativeDate(date: string) {
  return date
    .replace("about", "")
    .replace(" hours", "h")
    .replace(" hour", "h")
    .replace(" days", "d")
    .replace(" day", "d")
    .replace(" minutes", "m")
    .replace(" minute", "m")
    .replace(" seconds", "s")
    .replace(" second", "s")
    .replace("less than am", "1m");
}

export function getTruncatedRelativeDate(date: string) {
  return getRelativeDate(date, true);
}

export function getRelativeDate(date: string, truncate: boolean = false) {
  let content = formatDistanceToNow(new Date(date), { addSuffix: true });

  if (truncate) {
    content = shortenRelativeDate(content);
  }

  const daysSince = (new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24);

  // Show relative time if under 2 weeks, otherwise, use the template below.
  if (daysSince > 14) {
    content = formatDate(new Date(date), "M/d/yyyy");
  }

  return content;
}

function ReplayTitle({ title }: { title?: string | null }) {
  return (
    <div className={`${styles.replayTitle} overflow-hidden overflow-ellipsis whitespace-pre`}>
      {title || <span className="italic">Untitled</span>}
    </div>
  );
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

type RecordingRowProps = {
  addSelectedId: (recordingId: RecordingId) => void;
  isEditing: boolean;
  recording: Recording;
  removeSelectedId: (recordingId: RecordingId) => void;
  selected: boolean;
};

function RecordingRow({
  addSelectedId,
  isEditing,
  recording,
  removeSelectedId,
  selected,
}: RecordingRowProps) {
  const { permissions, loading: permissionsLoading } = useGetUserPermissions(recording);
  const allowSelecting =
    isEditing && (permissions.moveToLibrary || permissions.move || permissions.delete);

  const toggleChecked = () => {
    if (!allowSelecting) {
      return;
    }

    if (selected) {
      removeSelectedId(recording.id);
    } else {
      addSelectedId(recording.id);
    }
  };

  if (permissionsLoading) {
    return null;
  }

  return (
    <RowWrapper recording={recording} isEditing={isEditing} onClick={toggleChecked}>
      <div
        className={`group flex cursor-pointer flex-row border-b border-chrome ${styles.libraryRow}`}
      >
        <div className="flex w-12 flex-shrink-0 flex-row items-center overflow-hidden overflow-ellipsis whitespace-pre px-4 py-3">
          {allowSelecting ? (
            <input
              type="checkbox"
              onClick={e => e.stopPropagation()}
              onChange={toggleChecked}
              checked={selected}
              className="focus:primaryAccentHover h-4 w-4 rounded border-themeBorder text-primaryAccent"
            />
          ) : null}
        </div>
        <div className="flex-grow overflow-hidden overflow-ellipsis whitespace-pre px-1 py-3">
          <div className="flex flex-row items-center space-x-4 overflow-hidden">
            <div className="h-9 w-16 flex-shrink-0 overflow-hidden rounded-sm bg-chrome">
              <LazyLoad height={36} scrollContainer="#recording-list" once>
                <ItemScreenshot recordingId={recording.id} />
              </LazyLoad>
            </div>

            <div className={`flex flex-col space-y-0.5 overflow-hidden ${styles.recordingTitle}`}>
              <div className="flex items-center space-x-1">
                {recording.metadata?.test ? (
                  <TestResult result={recording.metadata.test.result} />
                ) : null}
                <ReplayTitle title={recording.title} />
              </div>
              <div className="flex flex-row space-x-4 font-light text-gray-400">
                <div
                  className="flex flex-row items-center space-x-1 overflow-hidden overflow-ellipsis whitespace-pre"
                  style={{ minWidth: "5rem" }}
                >
                  <img src="/images/timer.svg" className="w-3" />
                  <span>{getDurationString(recording.duration)}</span>
                </div>
                <div
                  className="flex flex-row items-center space-x-1 overflow-hidden overflow-ellipsis whitespace-pre"
                  style={{ minWidth: "6rem" }}
                >
                  <img src="/images/today.svg" className="w-3" />
                  <span>{getRelativeDate(recording.date)}</span>
                </div>
                <div className="overflow-hidden overflow-ellipsis whitespace-pre font-light text-gray-400">
                  {getDisplayedUrl(recording.url)}
                </div>
                {recording.metadata?.test?.file ? (
                  <div className="overflow-hidden overflow-ellipsis whitespace-pre font-light text-gray-400">
                    {recording.metadata.test.file}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="my-auto w-20 min-w-min flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-nowrap px-3 py-3 text-right">
          {recording.private ? "Private" : "Public"}
        </div>
        <div className="my-auto w-36 min-w-0 flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-nowrap px-3 py-3">
          {recording.user ? recording.user.name : "Unknown"}
        </div>
        <div className="flex w-12 flex-shrink-0 flex-row items-center overflow-hidden whitespace-pre px-3 py-3">
          {recording.comments.length ? (
            <div className="inline-block">
              <div className="flex flex-row space-x-1">
                <span>{recording.comments.length}</span>
                <img src="/images/comment-outline.svg" className="w-3" />
              </div>
            </div>
          ) : (
            <div className="flex w-12 flex-shrink-0 flex-row items-center overflow-hidden overflow-ellipsis whitespace-nowrap px-3 py-3" />
          )}
        </div>
        <div
          className="relative flex w-6 flex-shrink-0 flex-row items-center justify-center py-3 pr-4"
          onClick={e => e.stopPropagation()}
        >
          {!isEditing ? <RecordingOptionsDropdown {...{ recording }} /> : null}
        </div>
      </div>
    </RowWrapper>
  );
}

export function ItemScreenshot({ recordingId }: { recordingId: RecordingId }) {
  const { screenData } = hooks.useGetRecordingPhoto(recordingId);
  return (
    <Redacted>
      <div>{screenData && <img className="h-9 w-full object-contain" src={screenData} />}</div>
    </Redacted>
  );
}

export default RecordingRow;

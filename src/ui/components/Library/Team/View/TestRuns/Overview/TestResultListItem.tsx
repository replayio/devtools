import { RecordingId } from "@replayio/protocol";
import Link from "next/link";
import { useContext } from "react";

import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording } from "ui/types";

import { TeamContext } from "../../../TeamContextRoot";
import styles from "../../../../Library.module.css";

function ViewReplay({ passed, recordingId }: { passed: boolean; recordingId: RecordingId }) {
  return (
    <Link href={`/recording/${recordingId}`}>
      <a
        className="group flex cursor-pointer items-center justify-center p-2 transition"
        onClick={e => e.stopPropagation()}
      >
        <MaterialIcon
          iconSize="2xl"
          outlined
          className={
            passed
              ? "text-green-500 group-hover:text-green-400"
              : "text-red-500 group-hover:text-red-400"
          }
        >
          {passed ? "play_circle_filled" : "play_circle"}
        </MaterialIcon>
      </a>
    </Link>
  );
}

function Title({ recording }: { recording: Recording }) {
  return (
    <div className="flex flex-grow flex-row items-center space-x-2 overflow-hidden hover:cursor-pointer">
      <div className="flex flex-grow flex-col overflow-hidden py-2">
        {recording.metadata?.test?.title}
        <div className="text-xs text-gray-500">{recording.metadata?.test?.file}</div>
      </div>
    </div>
  );
}

function Comments({ recording }: { recording: Recording }) {
  const numComments = recording?.comments?.length;
  if (numComments == 0) {
    return null;
  }
  return (
    <div className="align-items-center flex flex-row space-x-1 text-gray-600">
      <img src="/images/comment-outline.svg" className="w-3" />
      <span>{numComments}</span>
    </div>
  );
}

function FilterByTestButton({ recording }: { recording: Recording }) {
  const { teamId } = useContext(TeamContext);
  const path = JSON.stringify(recording.metadata?.test?.path || []);

  return (
    <Link href={`/team/${teamId}/results?q=test-path:${path}`}>
      <a className="max-w-min overflow-hidden overflow-ellipsis whitespace-pre p-2 text-left opacity-0 hover:bg-gray-200 hover:underline group-hover:opacity-100">
        <MaterialIcon>filter_alt</MaterialIcon>
      </a>
    </Link>
  );
}

export function TestResultListItem({ recording }: { recording: Recording }) {
  const { metadata } = recording;
  const passed = metadata?.test?.result === "passed";
  const recordingId = recording.id;

  return (
    <div
      className={`group flex grow flex-row items-center px-2 transition duration-150 ${styles.libraryRow}`}
    >
      <Link href={`/recording/${recordingId}`}>
        <a
          className="group flex flex-grow cursor-pointer items-center justify-center space-x-2 p-2 transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ViewReplay passed={passed} recordingId={recordingId} />
          <Title recording={recording} />
        </a>
      </Link>
      <Comments recording={recording} />
      <FilterByTestButton recording={recording} />
    </div>
  );
}

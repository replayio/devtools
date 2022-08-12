import { useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording } from "ui/types";
import { TeamContext } from "../../../TeamContextRoot";
import Link from "next/link";
import styles from "../../../../Library.module.css";

function ViewReplay({ passed }: { passed: boolean }) {
  return (
    <Link href={`/recording/${recordingId}`}>
      <a
        className="flex items-center justify-center p-2 transition cursor-pointer group"
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
          {passed ? "play_circle_filled" : "play_circle" }          
        </MaterialIcon>
      </a>
    </Link>
  );
}

function Title({ recording }: { recording: Recording }) {
  return (
    <div className="flex flex-row items-center flex-grow space-x-2 overflow-hidden hover:cursor-pointer">
      <div className="flex flex-col flex-grow py-2 overflow-hidden">
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
    <div className="flex flex-row space-x-1 text-gray-600 align-items-center">
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
      <a className="p-2 overflow-hidden text-left whitespace-pre opacity-0 max-w-min overflow-ellipsis hover:underline group-hover:opacity-100 hover:bg-gray-200">
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
      className={`flex flex-row grow group items-center px-2 transition duration-150 ${styles.libraryRow}`}
    >
      <Link href={`/recording/${recordingId}`}>
        <a
          className="flex items-center justify-center flex-grow p-2 space-x-2 transition cursor-pointer group"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ViewReplay passed={passed} />
          <Title recording={recording} />
        </a>
      </Link>
      <Comments recording={recording} />
      <FilterByTestButton recording={recording} />
    </div>
  );
}

import { RecordingId } from "@replayio/protocol";
import Link from "next/link";

import { Recording } from "shared/graphql/types";
import MaterialIcon from "ui/components/shared/MaterialIcon";

import styles from "../../../../Library.module.css";

function ViewReplay({ passed, recordingId }: { passed: boolean; recordingId: RecordingId }) {
  return (
    <Link
      href={`/recording/${recordingId}`}
      className="group flex cursor-pointer items-center justify-center p-2 transition"
      onClick={e => e.stopPropagation()}
    >
      <MaterialIcon
        iconSize="2xl"
        outlined
        className={
          passed
            ? "text-[#219653] group-hover:text-[green-500]"
            : "text-[#EB5757] group-hover:text-red-500"
        }
      >
        {passed ? "play_circle" : "play_circle_filled"}
      </MaterialIcon>
    </Link>
  );
}

function Title({ recording }: { recording: Recording }) {
  const errorMsg = recording.metadata?.test?.tests
    ?.map(test => test.error?.message)
    .filter(Boolean)[0];

  return (
    <div className="flex flex-grow flex-row items-center space-x-2 overflow-hidden hover:cursor-pointer">
      <div className="flex flex-grow flex-col overflow-hidden py-2">
        {recording.metadata?.test?.title}
        <div className="text-xs text-bodySubColor">{recording.metadata?.test?.file}</div>
        {errorMsg ? <div className="text-xs text-bodySubColor">{errorMsg}</div> : null}
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

export function TestResultListItem({ recording }: { recording: Recording }) {
  const { metadata } = recording;
  const passed = metadata?.test?.result === "passed";
  const recordingId = recording.id;

  return (
    <div
      className={`group flex grow flex-row items-center px-2 transition duration-150 ${styles.libraryRow}`}
    >
      <Link
        href={`/recording/${recordingId}`}
        className="group flex flex-grow cursor-pointer items-center justify-center space-x-2 p-2 transition"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ViewReplay passed={passed} recordingId={recordingId} />
        <Title recording={recording} />
      </Link>
      <Comments recording={recording} />
    </div>
  );
}

import { RecordingId } from "@replayio/protocol";
import Link from "next/link";

import { Recording } from "shared/graphql/types";
import {
  isGroupedTestCasesV1,
  isGroupedTestCasesV2,
} from "shared/test-suites/RecordingTestMetadata";
import MaterialIcon from "ui/components/shared/MaterialIcon";

import styles from "../../../../Library.module.css";

function ViewReplay({ label, recordingId }: { label: string; recordingId: RecordingId }) {
  return (
    <Link
      href={`/recording/${recordingId}`}
      className="group flex cursor-pointer items-center justify-center transition"
      onClick={e => e.stopPropagation()}
    >
      <MaterialIcon
        iconSize="2xl"
        outlined
        className={
          label == "Passed"
            ? "text-[#219653] group-hover:text-[green-500]"
            : label == "Flaky"
            ? "text-[#FDBA00] group-hover:text-[yellow-500]"
            : "text-[#EB5757] group-hover:text-red-500"
        }
      >
        {["passed", "flaky"].includes(label) ? "play_circle" : "play_circle_filled"}
      </MaterialIcon>
    </Link>
  );
}

function Title({ recording }: { recording: Recording }) {
  const testMetadata = recording.metadata?.test;
  if (testMetadata == null) {
    return null;
  }

  let errorMessage;
  let filePath;
  let title;
  if (isGroupedTestCasesV1(testMetadata)) {
    errorMessage = testMetadata.tests?.find(test => test.error)?.error?.message;
    filePath = testMetadata.file;
    title = testMetadata.title;
  } else if (isGroupedTestCasesV2(testMetadata)) {
    errorMessage = testMetadata.tests.find(test => test.error)?.error?.message;
    filePath = testMetadata.source.path;
    title = testMetadata.source.title;
  } else {
    errorMessage = testMetadata.testRecordings.find(testRecording => testRecording.error)?.error
      ?.message;
    filePath = testMetadata.source.filePath;
    title = testMetadata.source.title;
  }

  return (
    <div className="flex flex-grow flex-row items-center space-x-4 overflow-hidden hover:cursor-pointer">
      <div className="flex flex-grow flex-col overflow-hidden">
        {title}
        <div className="text-xs text-bodySubColor">{filePath}</div>
        {errorMessage ? <div className="text-xs text-bodySubColor">{errorMessage}</div> : null}
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
    <div className="align-items-center flex shrink-0 flex-row space-x-1 text-gray-600">
      <img src="/images/comment-outline.svg" className="w-3" />
      <span>{numComments}</span>
    </div>
  );
}

export function TestResultListItem({ label, recording }: { label: string; recording: Recording }) {
  const recordingId = recording.id;

  return (
    <div
      className={`group flex grow flex-row items-center p-4 transition duration-150 ${styles.libraryRow}`}
    >
      <Link
        href={`/recording/${recordingId}`}
        className="group flex flex-grow cursor-pointer items-center justify-center gap-4 transition"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ViewReplay label={label} recordingId={recordingId} />
        <Title recording={recording} />
        <Comments recording={recording} />
      </Link>
    </div>
  );
}

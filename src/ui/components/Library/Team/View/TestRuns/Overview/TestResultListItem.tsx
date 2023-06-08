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
      className="flex cursor-pointer items-center justify-center transition"
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

  let filePath;
  let title;
  if (isGroupedTestCasesV1(testMetadata)) {
    filePath = testMetadata.file;
    title = testMetadata.title;
  } else if (isGroupedTestCasesV2(testMetadata)) {
    filePath = testMetadata.source.path;
    title = testMetadata.source.title;
  } else {
    filePath = testMetadata.source.filePath;
    title = testMetadata.source.title;
  }

  return (
    <div className="flex shrink grow flex-col truncate">
      <div className="block truncate">{title}</div>
      <div className="truncate truncate text-xs text-bodySubColor">{filePath}</div>
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
    <Link
      href={`/recording/${recordingId}`}
      className={`flex w-full flex-grow cursor-pointer flex-row items-center justify-center gap-2 truncate px-4 py-2 transition duration-150 ${styles.libraryRow}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <ViewReplay label={label} recordingId={recordingId} />
      <Title recording={recording} />
      <Comments recording={recording} />
    </Link>
  );
}

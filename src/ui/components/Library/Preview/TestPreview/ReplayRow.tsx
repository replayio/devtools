import { useContext } from "react";

import Link from "next/link";

import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording } from "ui/types";
import { getTruncatedRelativeDate } from "../../RecordingRow";
import { LibraryContext } from "../../useFilters";
import { MainRow } from "../shared/MainRow";

function PullRequestDetails({ id, title }: { id: string; title: string }) {
  return (
    <div className="flex flex-row items-center space-x-1 text-xs" title={title}>
      <div className="font-bold">PR</div>
      <div>{id}</div>
    </div>
  );
}

function CommitDetails({ recording }: { recording: Recording }) {
  const { metadata } = recording;
  const title = metadata.source?.commit.title || "Unknown commit message";

  return (
    <Link
      className="overflow-hidden overflow-ellipsis whitespace-pre text-left hover:cursor-pointer hover:underline"
      href={`/recording/${recording.id}`}
    >
      {title}
    </Link>
  );
}

function ReplayDetails({ recording }: { recording: Recording }) {
  const { metadata } = recording;
  const user = metadata.source?.trigger?.user;

  return (
    <div className="flex items-center space-x-3 text-xs text-gray-500">
      {metadata.source?.branch && (
        <div className="flex items-center space-x-1">
          <MaterialIcon>fork_right</MaterialIcon>
          <span>{metadata.source?.branch || "Unknown"}</span>
        </div>
      )}
      {metadata.source?.merge ? (
        <PullRequestDetails id={metadata.source.merge.id} title={metadata.source.merge.title} />
      ) : null}
      {!!user && <div>{user}</div>}
    </div>
  );
}

function ResultTab({ passed }: { passed: boolean }) {
  return (
    <div
      className={`mr-4 h-full w-1 rounded-tr-md rounded-br-md ${
        passed ? "bg-transparent" : "bg-red-500"
      }`}
    />
  );
}

const hasPassed = (recording: Recording) => recording.metadata.test?.result === "passed";

export function ReplayRow({ recording }: { recording: Recording }) {
  const { preview } = useContext(LibraryContext);
  const { metadata, date } = recording;
  const isFocused = preview?.view === "tests" && recording.id === preview.recordingId;

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    document.location = `/recording/${recording.id}`;
  };

  return (
    <MainRow
      onClick={onClick}
      isFocused={isFocused}
      passed={metadata.test?.result === "passed"}
      recordingId={recording.id}
    >
      <div className=" flex flex-grow flex-row items-center overflow-hidden py-2">
        <div className="flex flex-grow flex-col overflow-hidden">
          <CommitDetails recording={recording} />
          <ReplayDetails recording={recording} />
        </div>
        <div className="flex flex-shrink-0 text-gray-500">
          <span>{getTruncatedRelativeDate(date)}</span>
        </div>
      </div>
    </MainRow>
  );
}

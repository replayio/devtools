import { MouseEvent, useContext } from "react";
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
  const { setPreview, setView } = useContext(LibraryContext);

  const onViewTestRun = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setView("test-runs");
    setPreview({
      view: "test-runs",
      id: recording.metadata.test!.run!.id!,
      recordingId: recording.id,
    });
  };

  return (
    <button
      className="overflow-hidden text-left whitespace-pre overflow-ellipsis hover:underline"
      onClick={onViewTestRun}
    >
      {title}
    </button>
  );
}

function ReplayDetails({ recording }: { recording: Recording }) {
  const { metadata } = recording;
  const user = metadata.source?.trigger?.user;

  return (
    <div className="flex items-center space-x-3 text-xs text-gray-500">
      <div className="flex items-center space-x-1">
        <MaterialIcon>fork_right</MaterialIcon>
        <span>{metadata.source?.branch || "Unknown Branch"}</span>
      </div>
      {metadata.source?.merge ? (
        <PullRequestDetails id={metadata.source.merge.id} title={metadata.source.merge.title} />
      ) : null}
      {!!user && <div>{user}</div>}
    </div>
  );
}

export function ReplayRow({ recording }: { recording: Recording }) {
  const { preview, setPreview } = useContext(LibraryContext);
  const { metadata, date } = recording;
  const isFocused = preview?.view === "tests" && recording.id === preview.recordingId;

  const onClick = (e: React.MouseEvent) => {
    setPreview({ view: "tests", id: recording.metadata.test!.path!, recordingId: recording.id });
  };

  return (
    <MainRow
      onClick={onClick}
      isFocused={isFocused}
      passed={metadata.test?.result === "passed"}
      recordingId={recording.id}
    >
      <div className="flex flex-row items-center flex-grow py-2 space-x-2 overflow-hidden ">
        <div className="flex flex-col flex-grow overflow-hidden">
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

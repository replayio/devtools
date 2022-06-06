import { MouseEvent, useContext, useEffect, useRef } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording, RecordingMetadata, SourceMetadata } from "ui/types";
import { getFormattedTime } from "ui/utils/timeline";
import { getRelativeDate } from "../../RecordingRow";
import { LibraryContext } from "../../useFilters";
import { ResultIcon } from "../shared/ResultIcon";

function PullRequestDetails({ id, title }: { id: string; title: string }) {
  return (
    <div className="flex items-center space-x-1 text-gray-500">
      <MaterialIcon>merge</MaterialIcon>
      <span>{title}</span>
      <span>#{id}</span>
    </div>
  );
}

function CommitDetails({ source }: { source?: SourceMetadata }) {
  const title = source?.commit.title || "Unknown commit message";
  const id = source?.commit.id ? source.commit.id.substring(0, 7) : "Unknown ID";

  return (
    <div className="flex space-x-1">
      <span className="font-medium">{title}</span>
      <span className="overflow-hidden whitespace-pre overflow-ellipsis">({id})</span>
    </div>
  );
}

function ReplayDetails({ recording }: { recording: Recording }) {
  const { metadata, date, duration } = recording;

  return (
    <div className="flex items-center space-x-3 text-gray-500">
      <div className="flex items-center space-x-1">
        <MaterialIcon>fork_right</MaterialIcon>
        <span>{metadata.source?.branch || "Unknown branch"}</span>
      </div>
      <div className="flex items-center space-x-1">
        <MaterialIcon>schedule</MaterialIcon>
        <span>{getRelativeDate(date)}</span>
      </div>
      <div className="flex items-center space-x-1">
        <MaterialIcon>timer</MaterialIcon>
        <span>{getFormattedTime(duration)}</span>
      </div>
    </div>
  );
}

export function ReplayRow({ recording }: { recording: Recording }) {
  const { preview, setPreview } = useContext(LibraryContext);
  const rowNode = useRef<HTMLDivElement>(null);
  const { metadata } = recording;
  const isFocused = preview?.view === "tests" && recording.id === preview.recordingId;

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreview({ view: "tests", id: recording.metadata.test!.path!, recordingId: recording.id });
  };

  useEffect(() => {
    if (isFocused) {
      rowNode.current!.scrollIntoView({ behavior: "smooth" });
    }
  }, [isFocused]);

  return (
    <div
      className={`flex flex-row items-center flex-grow p-2 px-3 space-x-2 rounded-md ${
        isFocused ? "bg-blue-100" : "hover:bg-gray-100"
      }`}
      onClick={onClick}
      ref={rowNode}
    >
      <ResultIcon result={metadata.test?.result} />
      <div className="flex flex-col flex-grow">
        <CommitDetails source={metadata.source} />
        {metadata.source?.merge ? (
          <PullRequestDetails id={metadata.source.merge.id} title={metadata.source.merge.title} />
        ) : null}
        <ReplayDetails recording={recording} />
        {isFocused ? <Actions recordingId={recording.id} metadata={metadata} /> : null}
      </div>
    </div>
  );
}

function Actions({ recordingId, metadata }: { recordingId: string; metadata: RecordingMetadata }) {
  const { setView, setAppliedText } = useContext(LibraryContext);

  const onViewTestRun = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setView("recordings");
    setAppliedText(`test-run:${metadata.test!.run!.id}`);
  };

  return (
    <div className="flex pt-1 space-x-1">
      <a
        href={`/recording/${recordingId}`}
        target="_blank"
        rel="noreferrer noopener"
        className="underline"
      >
        Open Replay
      </a>
      <span>|</span>
      {metadata.test?.run?.id ? (
        <button onClick={onViewTestRun} className="underline">
          View Test Run ({metadata.test.run.id.slice(0, 7)})
        </button>
      ) : null}
    </div>
  );
}

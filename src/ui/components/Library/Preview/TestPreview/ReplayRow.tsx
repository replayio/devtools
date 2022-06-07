import { MouseEvent, useContext, useEffect, useRef } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording, RecordingMetadata, SourceMetadata } from "ui/types";
import { getFormattedTime } from "ui/utils/timeline";
import { getRelativeDate } from "../../RecordingRow";
import { LibraryContext } from "../../useFilters";
import { ResultIcon } from "../shared/ResultIcon";

function PullRequestDetails({ id, title }: { id: string; title: string }) {
  return (
    <div className="flex items-center space-x-1 text-xs text-gray-500">
      <MaterialIcon>merge</MaterialIcon>
      <span>{title}</span>
      <span>#{id}</span>
    </div>
  );
}

function CommitDetails({ recording }: { recording: Recording }) {
  const { metadata, duration } = recording;
  const title = metadata.source?.commit.title || "Unknown commit message";
  const id = metadata.source?.commit.id ? metadata.source.commit.id.substring(0, 7) : "Unknown ID";
  const { setView, setAppliedText } = useContext(LibraryContext);

  const onViewTestRun = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setView("recordings");
    setAppliedText(`test-run:${metadata.test!.run!.id}`);
  };

  return (
    <div className="flex space-x-1">
      <a href={`/recording/${recording.id}`}>
        <button className="flex items-center space-x-1 hover:underline">
          {getFormattedTime(duration)}
        </button>
      </a>
      <span>•</span>
      <button className="space-x-1 hover:underline" onClick={onViewTestRun}>
        <span>
          {title} ({id})
        </span>
      </button>
    </div>
  );
}

function ReplayDetails({ recording }: { recording: Recording }) {
  const { metadata, date } = recording;
  const user = metadata.source?.trigger?.user;

  return (
    <div className="flex items-center space-x-3 text-xs text-gray-500">
      <div className="flex items-center space-x-1">
        <MaterialIcon>play_circle</MaterialIcon>
        <span>{metadata.source?.trigger?.name || "Unknown trigger"}</span>
      </div>
      <div className="flex items-center space-x-1">
        <MaterialIcon>fork_right</MaterialIcon>
        <span>{metadata.source?.branch || "Unknown branch"}</span>
      </div>
      <div className="flex items-center space-x-1">
        <MaterialIcon>schedule</MaterialIcon>
        <span>{getRelativeDate(date)}</span>
      </div>
      {!!user && (
        <img title={user} className="w-5 h-5 rounded-full" src={`https://github.com/${user}.png`} />
      )}
    </div>
  );
}

export function ReplayRow({ recording }: { recording: Recording }) {
  const { preview, setPreview } = useContext(LibraryContext);
  const rowNode = useRef<HTMLDivElement>(null);
  const { metadata } = recording;
  const isFocused = preview?.view === "tests" && recording.id === preview.recordingId;

  const onClick = (e: React.MouseEvent) => {
    setPreview({ view: "tests", id: recording.metadata.test!.path!, recordingId: recording.id });
  };

  useEffect(() => {
    if (isFocused) {
      rowNode.current!.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  return (
    <div
      className={`flex flex-row items-center flex-grow border-b transition duration-150 ${
        isFocused ? "bg-blue-100" : "hover:bg-gray-100"
      }`}
      onClick={onClick}
      ref={rowNode}
    >
      <div
        className={`w-2 h-full ${
          metadata.test?.result === "passed" ? "bg-green-300" : "bg-red-500"
        }`}
      />
      <div className="flex flex-row items-center flex-grow p-2 space-x-2">
        <a href={`/recording/${recording.id}`}>
          <button className="flex items-center space-x-1 text-primaryAccent hover:text-primaryAccentHover">
            <MaterialIcon outlined={!isFocused} iconSize="2xl">
              play_circle
            </MaterialIcon>
          </button>
        </a>
        <div className="flex flex-col flex-grow">
          <CommitDetails recording={recording} />
          {metadata.source?.merge ? (
            <PullRequestDetails id={metadata.source.merge.id} title={metadata.source.merge.title} />
          ) : null}
          <ReplayDetails recording={recording} />
          {/* {isFocused ? <Actions recordingId={recording.id} metadata={metadata} /> : null} */}
        </div>
        <button className="grid items-center justify-center w-6 h-6">
          <MaterialIcon>more_vert</MaterialIcon>
        </button>
      </div>
    </div>
  );
}

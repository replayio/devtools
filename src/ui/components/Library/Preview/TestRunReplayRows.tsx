import { orderBy } from "lodash";
import { MouseEvent, useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording, SourceMetadata } from "ui/types";
import { getFormattedTime } from "ui/utils/timeline";
import { getRelativeDate } from "../RecordingRow";
import { LibraryContext } from "../useFilters";

export function TestRunReplayRows({ recordings }: { recordings: Recording[] }) {
  return (
    <div className="flex flex-col space-y-1">
      {orderBy(recordings, "date", "desc").map((r, i) => (
        <ReplayRow recording={r} key={i} />
      ))}
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

function ReplayRow({ recording }: { recording: Recording }) {
  const { setView, setAppliedText } = useContext(LibraryContext);
  const { metadata, date, duration } = recording;

  const onViewTest = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setView("recordings");
    setAppliedText(`test-path:${encodeURIComponent(JSON.stringify(metadata.test!.path))}`);
  };

  console.log({ metadata });
  return (
    <a href={`/recording/${recording.id}`} target="_blank" rel="noreferrer noopener">
      <div className="flex flex-row items-center flex-grow p-2 px-3 space-x-2 rounded-md hover:bg-gray-100">
        <ResultIcon result={metadata.test?.result} />
        <div className="flex flex-col flex-grow">
          <div className="flex space-x-1">
            <span className="font-medium">{metadata.test?.title}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-500">
            <div className="flex flex-row items-center space-x-1">
              <MaterialIcon>web_asset</MaterialIcon>
              <div>{metadata.test?.path?.[1]}</div>
            </div>
            <div className="flex flex-row items-center space-x-1">
              <MaterialIcon>description</MaterialIcon>
              <div>{metadata.test?.file}</div>
            </div>
            <div className="flex items-center space-x-1">
              <MaterialIcon>timer</MaterialIcon>
              <span>{getFormattedTime(duration)}</span>
            </div>
          </div>
          <div className="flex pt-1 space-x-1">
            <span className="hover:underline">Open Replay</span>
            <span>|</span>
            {metadata.test?.run?.id ? (
              <button onClick={onViewTest} className="hover:underline">
                View Test
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </a>
  );
}

function ResultIcon({ result }: { result?: "passed" | "failed" | "timedOut" }) {
  if (result === "passed") {
    return (
      <MaterialIcon className="text-green-500" iconSize="xl">
        check_circle
      </MaterialIcon>
    );
  } else if (result === "failed") {
    return (
      <MaterialIcon className="text-red-500" iconSize="xl">
        error
      </MaterialIcon>
    );
  } else if (result === "timedOut") {
    // TODO: Add a timeout icon
    return null;
  }

  return null;
}

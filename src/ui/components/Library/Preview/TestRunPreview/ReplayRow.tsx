import { MouseEvent, useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording, RecordingMetadata } from "ui/types";
import { getFormattedTime } from "ui/utils/timeline";
import { LibraryContext } from "../../useFilters";
import { ResultIcon } from "../shared/ResultIcon";

export function ReplayRow({ recording }: { recording: Recording }) {
  const { metadata, duration } = recording;

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
          <Actions metadata={metadata} />
        </div>
      </div>
    </a>
  );
}

function Actions({ metadata }: { metadata: RecordingMetadata }) {
  const { setView, setAppliedText } = useContext(LibraryContext);

  const onViewTest = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setView("recordings");
    setAppliedText(`test-path:${encodeURIComponent(JSON.stringify(metadata.test!.path))}`);
  };

  return (
    <div className="flex pt-1 space-x-1">
      <span className="hover:underline">Open Replay</span>
      <span>|</span>
      {metadata.test?.run?.id ? (
        <button onClick={onViewTest} className="hover:underline">
          View Test
        </button>
      ) : null}
    </div>
  );
}

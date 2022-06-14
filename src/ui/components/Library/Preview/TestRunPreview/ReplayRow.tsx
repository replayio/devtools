import { MouseEvent, useContext } from "react";
import { Recording } from "ui/types";
import { LibraryContext } from "../../useFilters";
import { MainRow } from "../shared/MainRow";
import { MainContextMenu } from "./Menu";

export function ReplayRow({ recording }: { recording: Recording }) {
  const { preview, setPreview } = useContext(LibraryContext);
  const { setView, setAppliedText } = useContext(LibraryContext);
  const { metadata } = recording;
  const isFocused = preview?.view === "test-runs" && recording.id === preview.recordingId;
  const runUrl = recording.metadata?.source?.trigger?.url;

  const onClick = (e: React.MouseEvent) => {
    setPreview({
      view: "test-runs",
      id: recording.metadata.test!.run!.id!,
      recordingId: recording.id,
    });
  };
  const onViewTest = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setView("recordings");
    setAppliedText(`test-path:${encodeURIComponent(JSON.stringify(metadata.test!.path))}`);
  };

  const onViewReplay = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    document.location = `/recording/${recording.id}`;
  };

  return (
    <MainRow
      onClick={onViewReplay}
      isFocused={isFocused}
      passed={metadata.test?.result === "passed"}
      recordingId={recording.id}
    >
      <div className="flex flex-grow flex-row items-center overflow-hidden">
        <div className="flex flex-grow flex-col overflow-hidden py-2">
          <button
            className="overflow-hidden overflow-ellipsis whitespace-pre text-left hover:underline"
            onClick={onViewReplay}
          >
            <span>{metadata.test?.title}</span>
          </button>
          <div className="flex space-x-2 text-xs text-gray-500">
            <button className="flex flex-row space-x-1 hover:underline">
              {metadata.test?.file}
            </button>
          </div>
        </div>
        {<MainContextMenu runUrl={runUrl} />}
      </div>
    </MainRow>
  );
}

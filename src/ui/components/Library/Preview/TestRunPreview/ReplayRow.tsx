import { MouseEvent, useContext } from "react";
import { Recording } from "ui/types";
import { LibraryContext } from "../../useFilters";
import { MainRow } from "../shared/MainRow";
import { MainContextMenu } from "./Menu";

export function ReplayRow({ recording }: { recording: Recording }) {
  const { preview, setPreview } = useContext(LibraryContext);
  const { setView } = useContext(LibraryContext);
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

    setView("tests");
    setPreview({ view: "tests", id: recording.metadata.test!.path!, recordingId: recording.id });
  };

  return (
    <MainRow
      onClick={onClick}
      isFocused={isFocused}
      passed={metadata.test?.result === "passed"}
      recordingId={recording.id}
    >
      <div className="flex flex-row items-center flex-grow space-x-2 overflow-hidden">
        <div className="flex flex-col flex-grow py-2 overflow-hidden">
          <button
            className="overflow-hidden text-left whitespace-pre overflow-ellipsis hover:underline"
            onClick={onViewTest}
          >
            <span>{metadata.test?.title}</span>
          </button>
          <div className="flex space-x-2 text-xs text-gray-500">
            <button className="flex flex-row space-x-1">{metadata.test?.file}</button>
          </div>
        </div>
        {runUrl ? <MainContextMenu runUrl={runUrl} /> : null}
      </div>
    </MainRow>
  );
}

import { MouseEvent, useContext, useEffect, useRef } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording } from "ui/types";
import { LibraryContext } from "../useFilters";

function StatusTab({ passed }: { passed: boolean }) {
  return (
    <div
      className={`flex-shrink-0 h-full w-1 rounded-tr-md rounded-br-md ${
        passed ? "bg-transparent" : "bg-red-500"
      }`}
    />
  );
}

function ViewReplay({ recordingId }: { recordingId: string }) {
  return (
    <a
      href={`/recording/${recordingId}`}
      target="_blank"
      rel="noreferrer noopener"
      title="View Replay"
    >
      <button className="flex items-center justify-center p-2 transition text-primaryAccent hover:text-primaryAccentHover">
        <MaterialIcon iconSize="2xl" outlined>
          play_circle
        </MaterialIcon>
      </button>
    </a>
  );
}

function Title({ recording }: { recording: Recording }) {
  const { setView, setAppliedText } = useContext(LibraryContext);
  const onViewTest = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setView("recordings");
    setAppliedText(
      `test-path:${encodeURIComponent(JSON.stringify(recording.metadata.test!.path))}`
    );
  };

  return (
    <div className="flex flex-row items-center flex-grow space-x-2 overflow-hidden">
      <div className="flex flex-col flex-grow py-2 overflow-hidden">
        <button
          className="overflow-hidden text-left whitespace-pre overflow-ellipsis hover:underline max-w-min"
          onClick={onViewTest}
        >
          {recording.metadata.test?.title}
        </button>
        <div className="flex space-x-2 text-xs text-gray-500">{recording.metadata.test?.file}</div>
      </div>
    </div>
  );
}

export function TestResultListItem({ recording }: { recording: Recording }) {
  const { metadata } = recording;
  const passed = metadata.test?.result === "passed";
  const rowNode = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`group flex items-center border-b pr-2 transition duration-150 hover:bg-gray-100`}
      ref={rowNode}
    >
      <StatusTab passed={passed} />
      <ViewReplay recordingId={recording.id} />
      <Title recording={recording} />
    </div>
  );
}

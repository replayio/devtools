import { MouseEvent, useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording } from "ui/types";
import { LibraryContext } from "../useFilters";

function ViewReplay({ recordingId, passed }: { recordingId: string; passed: boolean }) {
  return (
    <a
      href={`/recording/${recordingId}`}
      target="_blank"
      rel="noreferrer noopener"
      title="View Replay"
    >
      <button className="flex items-center justify-center p-2 transition">
        <MaterialIcon
          iconSize="2xl"
          outlined
          className={passed ? "text-primaryAccent" : "text-red-400"}
        >
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
    setAppliedText(`test-path:${JSON.stringify(recording.metadata.test!.path)}`);
  };

  return (
    <div className="flex flex-grow flex-row items-center space-x-2 overflow-hidden">
      <div className="flex flex-grow flex-col overflow-hidden py-2">
        <button
          className="max-w-min overflow-hidden overflow-ellipsis whitespace-pre text-left hover:underline"
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
  const recordingId = recording.id;

  return (
    <a
      className={`group flex items-center px-2 transition duration-150 hover:bg-gray-50`}
      href={`/recording/${recordingId}`}
      target="_blank"
      rel="noreferrer noopener"
      title="View Replay"
    >
      <ViewReplay recordingId={recordingId} passed={passed} />
      <Title recording={recording} />
    </a>
  );
}

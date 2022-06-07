import { MouseEvent, useContext, useEffect, useRef } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording, RecordingMetadata } from "ui/types";
import { getFormattedTime } from "ui/utils/timeline";
import { LibraryContext } from "../../useFilters";
import { ResultIcon } from "../shared/ResultIcon";

export function ReplayRow({ recording }: { recording: Recording }) {
  const { preview, setPreview } = useContext(LibraryContext);
  const { setView, setAppliedText } = useContext(LibraryContext);
  const { metadata, duration } = recording;
  const isFocused = preview?.view === "test-runs" && recording.id === preview.recordingId;
  const rowNode = useRef<HTMLDivElement>(null);

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
      ref={rowNode}
      onClick={onClick}
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
          <div className="flex space-x-1">
            <a href={`/recording/${recording.id}`}>
              <button className="flex items-center space-x-1 hover:underline">
                {getFormattedTime(duration)}
              </button>
            </a>
            <span>•</span>
            <button className="hover:underline">{metadata.test?.title}</button>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="flex flex-row items-center space-x-1" title={metadata.test?.path?.[1]}>
              <img className="w-4 h-4" src="/images/browser-firefox.svg" />
            </div>
            <button
              className="flex flex-row items-center space-x-1 hover:underline"
              onClick={onViewTest}
            >
              {metadata.test?.file}
            </button>
          </div>
          {/* {isFocused ? <Actions metadata={metadata} recordingId={recording.id} /> : null} */}
        </div>
        <button className="grid items-center justify-center w-6 h-6">
          <MaterialIcon>more_vert</MaterialIcon>
        </button>
      </div>
    </div>
  );
}

// function Actions({ metadata, recordingId }: { metadata: RecordingMetadata; recordingId: string }) {
//   const { setView, setAppliedText } = useContext(LibraryContext);

//   const onViewTest = (e: MouseEvent) => {
//     e.stopPropagation();
//     e.preventDefault();

//     setView("recordings");
//     setAppliedText(`test-path:${encodeURIComponent(JSON.stringify(metadata.test!.path))}`);
//   };

//   return (
//     <div className="flex pt-1 space-x-1">
//       <a
//         href={`/recording/${recordingId}`}
//         target="_blank"
//         rel="noreferrer noopener"
//         className="underline"
//       >
//         Open Replay
//       </a>
//       <span>|</span>
//       {metadata.test?.run?.id ? (
//         <button onClick={onViewTest} className="underline">
//           View Test
//         </button>
//       ) : null}
//     </div>
//   );
// }

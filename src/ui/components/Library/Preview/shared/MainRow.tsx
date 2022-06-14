import { MouseEvent, ReactNode, useEffect, useRef } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";

function ResultTab({ passed }: { passed: boolean }) {
  return (
    <div
      className={`w-2 h-full rounded-tr-md rounded-br-md ${
        passed ? "bg-transparent" : "bg-red-500"
      }`}
    />
  );
}

export function MainRow({
  isFocused,
  passed,
  onClick,
  children,
  recordingId,
}: {
  isFocused: boolean;
  passed: boolean;
  recordingId: string;
  onClick: (e: MouseEvent) => void;
  children: ReactNode;
}) {
  const rowNode = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused) {
      rowNode.current!.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  return (
    <div
      className={`group flex flex-grow flex-row items-center border-b pr-2 transition duration-150 ${
        isFocused ? "bg-blue-100" : "hover:bg-gray-100"
      }`}
      ref={rowNode}
      onClick={onClick}
    >
      <ResultTab passed={passed} />
      <ViewReplayButton isFocused={isFocused} recordingId={recordingId} />
      {children}
    </div>
  );
}

function ViewReplayButton({ isFocused, recordingId }: { isFocused: boolean; recordingId: string }) {
  return (
    <a
      href={`/recording/${recordingId}`}
      target="_blank"
      rel="noreferrer noopener"
      title="View Replay"
    >
      <button className="flex items-center justify-center p-2 text-primaryAccent transition hover:text-primaryAccentHover">
        <MaterialIcon iconSize="2xl" outlined={!isFocused}>
          play_circle
        </MaterialIcon>
      </button>
    </a>
  );
}

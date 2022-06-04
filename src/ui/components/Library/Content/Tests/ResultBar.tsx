import React, { useContext } from "react";
import { Recording } from "ui/types";
import { LibraryContext } from "../../useFilters";
import { TestsContext } from "./Tests";
import { TestTooltip } from "./TestTooltip";

export function ResultBar({
  recording,
  maxDuration,
}: {
  recording: Recording;
  maxDuration: number;
}) {
  const { setPreview } = useContext(LibraryContext);
  const { hoveredRunId, setHoveredRunId, hoveredRecordingId, setHoveredRecordingId } =
    useContext(TestsContext);
  const testRunId = recording.metadata?.test?.run?.id || null;

  const onMouseEnter = () => {
    const runId = recording.metadata.test?.run?.id;
    const recordingId = recording.id;

    setHoveredRecordingId(recordingId);
    if (runId) {
      setHoveredRunId(runId);
    }
  };
  const onMouseLeave = () => setHoveredRunId(null);
  const shouldFade = hoveredRunId && testRunId !== hoveredRunId;

  const height = `${maxDuration ? recording.duration / maxDuration : 100}%`;

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreview({ view: "tests", id: recording.metadata.test!.path!, recordingId: recording.id });
  };

  return (
    <div style={{ height }} className="relative">
      <div
        className={`h-full w-1.5 ${
          shouldFade
            ? "bg-gray-300"
            : recording.metadata.test!.result === "passed"
            ? "bg-green-500"
            : "bg-red-500"
        }`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      />
      {hoveredRecordingId === recording.id && hoveredRunId ? (
        <TestTooltip recordingId={hoveredRecordingId} runId={hoveredRunId} />
      ) : null}
    </div>
  );
}

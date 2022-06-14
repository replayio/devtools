import React, { useContext } from "react";
import { Recording } from "ui/types";
import { LibraryContext } from "../../useFilters";
import { TestsContext } from "./Tests";
import { TestTooltip } from "./TestTooltip";

function getColor(passed: boolean, testRunId?: string | null, hoveredRunId?: string | null) {
  const shouldHighlight = !!(hoveredRunId && testRunId === hoveredRunId);

  if (shouldHighlight) {
    return passed ? "bg-gray-400" : "bg-red-500";
  }

  return passed ? "bg-gray-200" : "bg-red-300";
}

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

  const height = `${maxDuration ? recording.duration / maxDuration : 100}%`;

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreview({ view: "tests", id: recording.metadata.test!.path!, recordingId: recording.id });
  };

  const passed = recording.metadata.test?.result === "passed";
  const color = getColor(passed, testRunId, hoveredRunId);

  return (
    <div style={{ height }} className="relative">
      <div
        className={`h-full w-1.5 ${color}`}
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

import { useContext, useState } from "react";

import {
  RootCauseAnalysisDataV3,
  Sequence,
} from "shared/root-cause-analysis/RootCauseAnalysisData";

import { Collapsible } from "./Collapsible";
import { ReplayLink } from "./ReplayLink";
import { RootCauseContext } from "./RootCause";

let UNKNOWN_SOURCE = "Unknown source";

export function ExecutedStatementSequences({
  sequences,
  failingFrames,
  passingFrames,
}: {
  sequences: Sequence<RootCauseAnalysisDataV3.ExecutedStatementDiscrepancy>[];
  failingFrames: RootCauseAnalysisDataV3.FormattedFrame[];
  passingFrames: RootCauseAnalysisDataV3.FormattedFrame[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {sequences.map((d, i) => (
        <ExecutedStatementSequence
          group={d}
          key={i}
          failingFrames={failingFrames}
          passingFrames={passingFrames}
        />
      ))}
    </div>
  );
}
function ExecutedStatementSequence({
  group,
  failingFrames,
  passingFrames,
}: {
  group: Sequence<RootCauseAnalysisDataV3.ExecutedStatementDiscrepancy>;
  failingFrames: RootCauseAnalysisDataV3.FormattedFrame[];
  passingFrames: RootCauseAnalysisDataV3.FormattedFrame[];
}) {
  return (
    <div className="pl-4">
      <div className="flex flex-col gap-2">
        {group.discrepancies.map((d, i) => (
          <ExecutedStatementDiscrepancyDisplay
            key={i}
            discrepancy={d}
            sequenceId={group.sequenceId}
            failingFrames={failingFrames}
            passingFrames={passingFrames}
          />
        ))}
      </div>
    </div>
  );
}

function generateFrameKey(sourceId: string, line: number, column: number) {
  return `${sourceId}:${line}:${column}`;
}

function ExecutedStatementDiscrepancyDisplay({
  discrepancy,
  sequenceId,
  failingFrames,
  passingFrames,
}: {
  discrepancy: RootCauseAnalysisDataV3.ExecutedStatementDiscrepancy;
  sequenceId: string;
  failingFrames: RootCauseAnalysisDataV3.FormattedFrame[];
  passingFrames: RootCauseAnalysisDataV3.FormattedFrame[];
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { failedId, successId } = useContext(RootCauseContext);

  const { kind, event } = discrepancy;
  const recordingId = kind === "Extra" ? failedId : successId;

  let functionName: string | undefined = undefined;
  let points: RootCauseAnalysisDataV3.FramePoint[] = [];
  let otherPoints: RootCauseAnalysisDataV3.FramePoint[] = [];

  const divergenceText =
    kind === "Extra" ? "Detected an extra statement" : "Detected a missing statement";

  const midLine = discrepancy.event.location[discrepancy.event.location.length - 1];
  const ALLOWANCE = 3;
  const beginLine = midLine.line - ALLOWANCE;
  const endLine = midLine.line + ALLOWANCE;

  if (event.description) {
    const { sourceId, line, column } = event.description;
    const frameKey = generateFrameKey(sourceId, line, column);
    const failingFrame = failingFrames.find(f => f.key === frameKey);
    const passingFrame = passingFrames.find(f => f.key === frameKey);

    if (failingFrame) {
      functionName = failingFrame.functionName;
      points = frameToFramePoints(failingFrame, beginLine, endLine);
    }
    if (passingFrame) {
      otherPoints = frameToFramePoints(passingFrame, beginLine, endLine);
    }
  }

  const lines: number[] = new Array(endLine - beginLine).fill(beginLine).map((l, i) => l + i);

  // TODO Rewrite this component to be line-oriented instead of column-oriented

  return (
    <div
      onClick={() => console.log(points)}
      className="flex flex-col gap-2 rounded-lg p-3"
      style={{ backgroundColor: "#293347" }}
    >
      <div
        className="flex flex-row items-center justify-between"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex flex-row items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-white" />
          <div className="flex flex-shrink-0 flex-col">
            <div className="text-lg font-bold" title={sequenceId}>
              {functionName} function
            </div>
            <div className="text-sm">{divergenceText}</div>
          </div>
        </div>
        <div className="pointer-events-none cursor-pointer font-mono">
          {isCollapsed ? "◀" : "▼"}
        </div>
      </div>
      {isCollapsed ? null : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-row overflow-auto bg-gray-900 font-mono text-xs">
            <div className="flex flex-col items-end" style={{ minWidth: "2rem" }}>
              {lines.map((l, i) => {
                return (
                  <div
                    key={i}
                    className="px-1"
                    style={
                      l == midLine.line
                        ? {
                            backgroundColor: "var(--background-color-current-execution-point)",
                            borderTop: "1px solid var(--border-color-current-execution-point)",
                            borderBottom: "1px solid var(--border-color-current-execution-point)",
                          }
                        : {}
                    }
                  >
                    {l}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col">
              {lines.map((l, i) => {
                const point = points.find(p => p.location.line === l);
                return (
                  <div
                    key={i}
                    style={
                      l == midLine.line
                        ? {
                            borderTop: "1px solid var(--border-color-current-execution-point)",
                            borderBottom: "1px solid var(--border-color-current-execution-point)",
                          }
                        : {}
                    }
                    className={`px-1 ${point?.breakable ? "bg-green-700" : "bg-gray-600"}`}
                  >
                    {point?.hits}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col">
              {lines.map((l, i) => {
                const point = otherPoints.find(p => p.location.line === l);
                return (
                  <div
                    key={i}
                    style={
                      l == midLine.line
                        ? {
                            borderTop: "1px solid var(--border-color-current-execution-point)",
                            borderBottom: "1px solid var(--border-color-current-execution-point)",
                          }
                        : {}
                    }
                    className={`px-1 ${point?.breakable ? "bg-red-700" : "bg-gray-600"}`}
                  >
                    {point?.hits}
                  </div>
                );
              })}
            </div>
            <div className="grid overflow-auto">
              {/* <div className="flex flex-col overflow-auto"> */}
              {lines.map((l, i) => {
                const point = points.find(p => p.location.line === l);
                return (
                  <div
                    key={i}
                    className="whitespace-pre"
                    style={
                      l == midLine.line
                        ? {
                            backgroundColor: "var(--background-color-current-execution-point)",
                            borderTop: "1px solid var(--border-color-current-execution-point)",
                            borderBottom: "1px solid var(--border-color-current-execution-point)",
                            fontWeight: "bold",
                          }
                        : {}
                    }
                  >
                    {point?.text || ""}
                  </div>
                );
              })}
            </div>
          </div>
          <ReplayLink
            id={recordingId}
            kind={kind.toLowerCase() as "extra" | "missing"}
            result={kind == "Extra" ? "failing" : "passing"}
            point={event.point}
            time={event.time}
          />
        </div>
      )}
    </div>
  );
}

function frameToFramePoints(
  frame: RootCauseAnalysisDataV3.FormattedFrame,
  beginLine: number,
  endLine: number
) {
  const firstArrayIndex = beginLine - frame.startingLineNumber;
  const numLines = endLine - beginLine;
  const lineHits = frame.hitCounts.slice(firstArrayIndex, firstArrayIndex + numLines);
  const sourceLines = frame.sourceLines.slice(firstArrayIndex, firstArrayIndex + numLines);
  const breakableLines = frame.breakableLines.slice(firstArrayIndex, firstArrayIndex + numLines);
  return lineHits.map((h, i) => ({
    hits: h,
    text: sourceLines[i],
    breakable: breakableLines[i] ?? false,
    location: {
      sourceId: frame.sourceId,
      line: beginLine + i,
      column: 0,
    },
  }));
}

function getSource(url?: string) {
  return url ? url.split("/").pop() : UNKNOWN_SOURCE;
}

import { useContext, useState } from "react";

import { Collapsible } from "./Collapsible";
import { ReplayLink } from "./ReplayLink";
import { RootCauseContext } from "./RootCause";
import { ExecutedStatementDiscrepancy, Sequence } from "./types";

let UNKNOWN_SOURCE = "Unknown source";

export function ExecutedStatementSequences({
  sequences,
}: {
  sequences: Sequence<ExecutedStatementDiscrepancy>[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {sequences.map((d, i) => (
        <ExecutedStatementSequence group={d} key={i} />
      ))}
    </div>
  );
}
function ExecutedStatementSequence({ group }: { group: Sequence<ExecutedStatementDiscrepancy> }) {
  return (
    <div className="pl-4">
      <div className="flex flex-col gap-2">
        {group.discrepancies.map((d, i) => (
          <ExecutedStatementDiscrepancyDisplay
            key={i}
            discrepancy={d}
            sequenceId={group.sequenceId}
          />
        ))}
      </div>
    </div>
  );
}

function ExecutedStatementDiscrepancyDisplay({
  discrepancy,
  sequenceId,
}: {
  discrepancy: ExecutedStatementDiscrepancy;
  sequenceId: string;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { failedId, successId } = useContext(RootCauseContext);
  const source = getSource(discrepancy.event.description?.url);
  const { kind, event } = discrepancy;
  const recordingId = kind === "Extra" ? failedId : successId;

  const functionName = discrepancy.event.description!.frame.functionName;
  const divergenceText =
    kind === "Extra" ? "Detected an extra statement" : "Detected a missing statement";

  const midLine = discrepancy.event.location[discrepancy.event.location.length - 1];
  const ALLOWANCE = 3;
  const beginLine = midLine.line - ALLOWANCE;
  const endLine = midLine.line + ALLOWANCE;

  const points = discrepancy.event.description!.frame.points.filter(
    (p: any) => p.location.line >= beginLine && p.location.line <= endLine
  );
  const otherPoints = discrepancy.event.description!.frame.otherPoints.filter(
    (p: any) => p.location.line >= beginLine && p.location.line <= endLine
  );
  const lines = new Array(endLine - beginLine).fill(beginLine).map((l, i) => l + i);

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
                const point = points.find((p: any) => p.location.line === l);
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
                    className={`px-1 ${point.breakable ? "bg-green-700" : "bg-gray-600"}`}
                  >
                    {points.find((p: any) => p.location.line === l).hits}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col">
              {lines.map((l, i) => {
                const point = otherPoints.find((p: any) => p.location.line === l);
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
                    className={`px-1 ${point.breakable ? "bg-red-700" : "bg-gray-600"}`}
                  >
                    {point.hits}
                  </div>
                );
              })}
            </div>
            <div className="grid overflow-auto">
              {/* <div className="flex flex-col overflow-auto"> */}
              {lines.map((l, i) => {
                const point = points.find((p: any) => p.location.line === l);
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
                    {point.text || " "}
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

function getSource(url?: string) {
  return url ? url.split("/").pop() : UNKNOWN_SOURCE;
}

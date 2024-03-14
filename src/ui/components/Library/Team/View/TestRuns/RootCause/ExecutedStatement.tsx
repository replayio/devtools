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
          <ExecutedStatementDiscrepancy key={i} discrepancy={d} sequenceId={group.sequenceId} />
        ))}
      </div>
    </div>
  );
}
function ExecutedStatementDiscrepancy({
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
    p => p.location.line >= beginLine && p.location.line <= endLine
  );
  const otherPoints = discrepancy.event.description!.frame.otherPoints.filter(
    p => p.location.line >= beginLine && p.location.line <= endLine
  );

  return (
    <div
      onClick={() => console.log(points)}
      className="flex flex-col gap-2 rounded-lg bg-gray-700 p-3"
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
          <div className="overflow-auto bg-gray-900">
            {points.map((p: any, i: number) => (
              <div key={i} className="flex flex-row gap-2 font-mono text-xs">
                <div className="flex flex-row gap-1">
                  <div
                    className={`text-right ${p.breakable ? "" : "opacity-50"}`}
                    style={{ minWidth: "2rem" }}
                  >
                    {p.location.line}
                  </div>
                  {p.breakable ? (
                    <div className="flex flex-row gap-1">
                      <div className="w-3 bg-green-700 text-center">{p.hits}</div>
                      <div className="w-3 bg-red-700 text-center">
                        {
                          otherPoints.find(
                            (otherPoint: any) => otherPoint.location.line === p.location.line
                          )!.hits
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-row gap-1">
                      <div className="w-3 bg-gray-600 text-center" />
                      <div className="w-3 bg-gray-600 text-center" />
                    </div>
                  )}
                </div>
                <div
                  className={`whitespace-pre ${
                    p.location.line === midLine.line ? "font-bold" : ""
                  }`}
                >
                  {p.text}
                </div>
              </div>
            ))}
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

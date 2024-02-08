import { useContext } from "react";

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
    <div className="flex flex-col gap-2 pl-4">
      {sequences.map((d, i) => (
        <ExecutedStatementSequence group={d} key={i} />
      ))}
    </div>
  );
}
function ExecutedStatementSequence({ group }: { group: Sequence<ExecutedStatementDiscrepancy> }) {
  return (
    <Collapsible label={`${group.kind} ${group.sequenceId}`}>
      <div className="pl-4">
        <div className="flex flex-col gap-2">
          {group.discrepancies.map((d, i) => (
            <ExecutedStatementDiscrepancy key={i} discrepancy={d} />
          ))}
        </div>
      </div>
    </Collapsible>
  );
}
function ExecutedStatementDiscrepancy({
  discrepancy,
}: {
  discrepancy: ExecutedStatementDiscrepancy;
}) {
  const { failedId, successId } = useContext(RootCauseContext);
  const source = getSource(discrepancy.event.description?.url);
  const { kind, event } = discrepancy;
  const recordingId = kind === "Extra" ? failedId : successId;

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between gap-4">
        <div className="truncate font-mono" title={discrepancy.event.key}>
          {discrepancy.event.key}
        </div>
        <div className="whitespace-pre">{source}</div>
      </div>
      <ReplayLink
        id={recordingId}
        kind={kind.toLowerCase() as "extra" | "missing"}
        result={kind == "Extra" ? "failing" : "passing"}
        point={event.point}
        time={event.time}
      />
    </div>
  );
}

function getSource(url?: string) {
  return url ? url.split("/").pop() : UNKNOWN_SOURCE;
}

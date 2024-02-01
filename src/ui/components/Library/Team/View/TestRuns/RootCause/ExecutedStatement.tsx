import { useContext } from "react";

import { Collapsible } from "./Collapsible";
import { RootCauseContext } from "./RootCause";
import { ExecutedStatementDiscrepancyType, Sequence } from "./types";

let UNKNOWN_SOURCE = "Unknown source";

export function ExecutedStatementSequences({
  sequences,
}: {
  sequences: Sequence<ExecutedStatementDiscrepancyType>[];
}) {
  return (
    <div className="flex flex-col gap-2 pl-4">
      {sequences.map((d, i) => (
        <ExecutedStatementSequence group={d} key={i} />
      ))}
    </div>
  );
}
function ExecutedStatementSequence({
  group,
}: {
  group: Sequence<ExecutedStatementDiscrepancyType>;
}) {
  const { failedId, successId } = useContext(RootCauseContext);
  const recordingId = group.kind === "Extra" ? failedId : successId;

  return (
    <Collapsible label={`${group.kind} ${group.sequenceId}`}>
      <div className="pl-4">
        <div>
          {group.discrepancies.map((d, i) => (
            <ExecutedStatementDiscrepancy key={i} discrepancy={d} />
          ))}
        </div>
        <a href={`/recording/${recordingId}`} target="_blank" rel="noreferrer">
          Go to <span className="italic">{group.kind.toLowerCase()}</span> point in{" "}
          <span className="italic">{group.kind == "Extra" ? "failing" : "passing"}</span> replay
        </a>
      </div>
    </Collapsible>
  );
}
function ExecutedStatementDiscrepancy({
  discrepancy,
}: {
  discrepancy: ExecutedStatementDiscrepancyType;
}) {
  const source = getSource(discrepancy.event.description.url);
  return (
    <div className="flex flex-row justify-between gap-4">
      <div className="truncate font-mono">{discrepancy.event.key}</div>
      <div className="whitespace-pre">{source}</div>
    </div>
  );
}

function getSource(url: string) {
  return url ? url.split("/").pop() : UNKNOWN_SOURCE;
}

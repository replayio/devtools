import { useContext } from "react";

import { Collapsible } from "./Collapsible";
import { ReplayLink } from "./ReplayLink";
import { RootCauseContext } from "./RootCause";
import { ReactComponentDiscrepancy, Sequence } from "./types";

export function ReactComponentSequences({
  sequences,
}: {
  sequences: Sequence<ReactComponentDiscrepancy>[];
}) {
  return (
    <div className="flex flex-col gap-2 pl-4">
      {sequences.map((d, i) => (
        <ReactComponentSequence group={d} key={i} />
      ))}
    </div>
  );
}
function ReactComponentSequence({ group }: { group: Sequence<ReactComponentDiscrepancy> }) {
  const { failedId, successId } = useContext(RootCauseContext);
  const recordingId = group.kind === "Extra" ? failedId : successId;

  return (
    <Collapsible label={`${group.kind} ${group.sequenceId}`}>
      <div className="pl-4">
        <div>
          {group.discrepancies.map((d, i) => (
            <ReactComponentDiscrepancy key={i} discrepancy={d} />
          ))}
        </div>
        <ReplayLink
          id={recordingId}
          kind={group.kind.toLowerCase() as "extra" | "missing"}
          result={group.kind == "Extra" ? "failing" : "passing"}
          point={group.discrepancies[0].event.point}
          time={group.discrepancies[0].event.time}
        />
      </div>
    </Collapsible>
  );
}
function ReactComponentDiscrepancy({ discrepancy }: { discrepancy: ReactComponentDiscrepancy }) {
  return <div>nodeName: {discrepancy.event.nodeName}</div>;
}

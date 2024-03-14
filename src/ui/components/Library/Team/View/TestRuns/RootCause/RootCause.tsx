import { createContext } from "react";

import { Collapsible } from "./Collapsible";
import { ExecutedStatementSequences } from "./ExecutedStatement";
import { NetworkEventSequences } from "./NetworkEvent";
import { ReactComponentSequences } from "./ReactComponent";
import {
  AnyDiscrepancy,
  EventKind,
  ExecutedStatementDiscrepancy,
  NetworkEventDiscrepancy,
  ReactComponentDiscrepancy,
  RootCauseAnalysisResult,
  Sequence,
} from "./types";

function groupSequences(discrepancies: AnyDiscrepancy[]) {
  const grouped: Record<EventKind, Record<string, Sequence<AnyDiscrepancy>>> = {};

  discrepancies.forEach(d => {
    if (!grouped[d.eventKind]) {
      grouped[d.eventKind] = {};
    }

    const group = grouped[d.eventKind];
    if (!group[d.sequenceId]) {
      group[d.sequenceId] = {
        sequenceId: d.sequenceId,
        kind: d.kind,
        discrepancies: [d],
      };
    } else {
      group[d.sequenceId].discrepancies.push(d);
    }
  });

  return { NetworkEvent: [], ExecutedStatement: [], ReactComponent: [], ...grouped };
}

type RootCauseContextType = {
  failedId: string;
  successId: string;
};

export const RootCauseContext = createContext<RootCauseContextType>(null as any);

export function RootCause({ discrepancy }: { discrepancy: RootCauseAnalysisResult }) {
  const testFailure = discrepancy;
  const failedId = testFailure.failedRun.id.recordingId;
  const successId = testFailure.successRun.id.recordingId;
  const groupedSequences = groupSequences(testFailure.discrepancies);

  console.log({ groupedSequences });

  return (
    <RootCauseContext.Provider value={{ failedId, successId }}>
      <div className="flex flex-col">
        <div className="flex flex-col gap-4 px-4">
          <Collapsible
            label={`ReactComponent`}
            // label={`ReactComponent (${Object.keys(groupedSequences["ReactComponent"]).length})`}
          >
            <ReactComponentSequences
              sequences={
                Object.values(
                  groupedSequences["ReactComponent"]
                ) as Sequence<ReactComponentDiscrepancy>[]
              }
            />
          </Collapsible>
          <Collapsible
            label={`ExecutedStatement`}
            // label={`ExecutedStatement (${
            //   Object.keys(groupedSequences["ExecutedStatement"]).length
            // })`}
          >
            <ExecutedStatementSequences
              sequences={
                Object.values(
                  groupedSequences["ExecutedStatement"]
                ) as Sequence<ExecutedStatementDiscrepancy>[]
              }
            />
          </Collapsible>
          <Collapsible
            label={`NetworkEvent`}
            // label={`NetworkEvent (${Object.keys(groupedSequences["NetworkEvent"]).length})`}
          >
            <NetworkEventSequences
              sequences={
                Object.values(
                  groupedSequences["NetworkEvent"]
                ) as Sequence<NetworkEventDiscrepancy>[]
              }
            />
          </Collapsible>
        </div>
      </div>
    </RootCauseContext.Provider>
  );
}

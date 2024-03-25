import { createContext } from "react";

import {
  RootCauseAnalysisDataV1,
  Sequence,
} from "shared/root-cause-analysis/RootCauseAnalysisData";

import { Collapsible } from "./Collapsible";
import { ExecutedStatementSequences } from "./ExecutedStatement";
import { NetworkEventSequences } from "./NetworkEvent";
import { ReactComponentSequences } from "./ReactComponent";

interface GroupedSequences {
  ExecutedStatement: Record<string, Sequence<RootCauseAnalysisDataV1.ExecutedStatementDiscrepancy>>;
  NetworkEvent: Record<string, Sequence<RootCauseAnalysisDataV1.NetworkEventDiscrepancy>>;
  ReactComponent: Record<string, Sequence<RootCauseAnalysisDataV1.ReactComponentDiscrepancy>>;
  CustomEvent: Record<string, Sequence<RootCauseAnalysisDataV1.CustomEventDiscrepancy>>;
}

function groupSequences(discrepancies: RootCauseAnalysisDataV1.AnyDiscrepancy[]) {
  const grouped: GroupedSequences = {
    ExecutedStatement: {},
    NetworkEvent: {},
    ReactComponent: {},
    CustomEvent: {},
  };

  discrepancies.forEach(d => {
    if (!grouped[d.eventKind]) {
      grouped[d.eventKind] = {};
    }

    const group = grouped[d.eventKind];
    if (!group[d.sequenceId]) {
      group[d.sequenceId] = {
        sequenceId: d.sequenceId,
        kind: d.kind,
        // Lame type hack, but it works for now
        discrepancies: [d] as any[],
      };
    } else {
      group[d.sequenceId].discrepancies.push(d as any);
    }
  });

  return grouped;
}

type RootCauseContextType = {
  failedId: string;
  successId: string;
};

export const RootCauseContext = createContext<RootCauseContextType>(null as any);

export function RootCause({
  discrepancy,
}: {
  discrepancy: RootCauseAnalysisDataV1.RootCauseAnalysisResult;
}) {
  const testFailure = discrepancy;
  const failedId = testFailure.failedRun.id.recordingId;
  const successId = testFailure.successRun.id.recordingId;
  const groupedSequences = groupSequences(testFailure.discrepancies);

  return (
    <RootCauseContext.Provider value={{ failedId, successId }}>
      <div className="flex flex-col">
        <div className="flex flex-col gap-4 px-4">
          <Collapsible label={`ReactComponent`}>
            <ReactComponentSequences
              sequences={Object.values(groupedSequences["ReactComponent"])}
            />
          </Collapsible>
          <Collapsible label={`ExecutedStatement`}>
            <ExecutedStatementSequences
              sequences={Object.values(groupedSequences["ExecutedStatement"])}
            />
          </Collapsible>
          <Collapsible label={`NetworkEvent`}>
            <NetworkEventSequences sequences={Object.values(groupedSequences["NetworkEvent"])} />
          </Collapsible>
        </div>
      </div>
    </RootCauseContext.Provider>
  );
}

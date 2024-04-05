import { createContext } from "react";

import {
  RootCauseAnalysisDataV3,
  Sequence,
} from "shared/root-cause-analysis/RootCauseAnalysisData";

import { Collapsible } from "./Collapsible";
import { ExecutedStatementSequences } from "./ExecutedStatement";
import { NetworkEventSequences } from "./NetworkEvent";
import { ReactComponentSequences } from "./ReactComponent";

interface GroupedSequences {
  ExecutedStatement: Record<string, Sequence<RootCauseAnalysisDataV3.ExecutedStatementDiscrepancy>>;
  NetworkEvent: Record<string, Sequence<RootCauseAnalysisDataV3.NetworkEventDiscrepancy>>;
  ReactComponent: Record<string, Sequence<RootCauseAnalysisDataV3.ReactComponentDiscrepancy>>;
  CustomEvent: Record<string, Sequence<RootCauseAnalysisDataV3.CustomEventDiscrepancy>>;
}

function groupSequences(discrepancies: RootCauseAnalysisDataV3.AnyDiscrepancy[]) {
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
  discrepancy: RootCauseAnalysisDataV3.RootCauseAnalysisResult;
}) {
  const testFailure = discrepancy;
  const failedId = testFailure.failedRun.id.recordingId;
  const successId = testFailure.successRun.id.recordingId;
  const groupedSequences = groupSequences(testFailure.discrepancies);

  const { failingFrames, passingFrames } = testFailure;

  const reactSequences = Object.values(groupedSequences["ReactComponent"]);
  const executedSequences = Object.values(groupedSequences["ExecutedStatement"]);
  const networkSequences = Object.values(groupedSequences["NetworkEvent"]);

  return (
    <RootCauseContext.Provider value={{ failedId, successId }}>
      <div className="flex flex-col">
        <div className="flex flex-col gap-4 px-4">
          {reactSequences.length > 0 ? (
            <Collapsible label={`ReactComponent`}>
              <ReactComponentSequences sequences={reactSequences} />
            </Collapsible>
          ) : null}
          {executedSequences.length > 0 ? (
            <Collapsible label={`ExecutedStatement`}>
              <ExecutedStatementSequences
                sequences={executedSequences}
                failingFrames={failingFrames}
                passingFrames={passingFrames}
              />
            </Collapsible>
          ) : null}
          {networkSequences.length > 0 ? (
            <Collapsible label={`NetworkEvent`}>
              <NetworkEventSequences sequences={networkSequences} />
            </Collapsible>
          ) : null}
        </div>
      </div>
    </RootCauseContext.Provider>
  );
}

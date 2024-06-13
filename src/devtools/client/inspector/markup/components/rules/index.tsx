import { Suspense } from "react";

import { RulesPanelSuspends } from "devtools/client/inspector/markup/components/rules/RulesPanel";
import { getSelectedNodeId } from "devtools/client/inspector/markup/selectors/markup";
import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { useAppSelector } from "ui/setup/hooks";

export function RulesPanel() {
  const selectedNodeId = useAppSelector(getSelectedNodeId);

  return (
    <InlineErrorBoundary name="RulesPanel" resetKey={selectedNodeId ?? undefined}>
      <Suspense fallback={<PanelLoader />}>
        <RulesPanelSuspends />
      </Suspense>
    </InlineErrorBoundary>
  );
}

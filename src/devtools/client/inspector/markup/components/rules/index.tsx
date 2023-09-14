import { Suspense } from "react";

import { RulesPanelSuspends } from "devtools/client/inspector/markup/components/rules/RulesPanel";
import { getSelectedNodeId } from "devtools/client/inspector/markup/selectors/markup";
import ErrorBoundary from "replay-next/components/ErrorBoundary";
import Loader from "replay-next/components/Loader";
import { useAppSelector } from "ui/setup/hooks";

export function RulesPanel() {
  const selectedNodeId = useAppSelector(getSelectedNodeId);

  return (
    <ErrorBoundary name="RulesPanel" resetKey={selectedNodeId ?? undefined}>
      <Suspense fallback={<Loader />}>
        <RulesPanelSuspends />
      </Suspense>
    </ErrorBoundary>
  );
}

import { Suspense } from "react";

import { RulesPanelSuspends } from "devtools/client/inspector/markup/components/rules/RulesPanel";
import Loader from "replay-next/components/Loader";

export function RulesPanel() {
  return (
    <Suspense fallback={<Loader />}>
      <RulesPanelSuspends />
    </Suspense>
  );
}

import classnames from "classnames";
import { useEffect } from "react";

// Add the necessary imports for nag functionality
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";

import Outline from "../SourceOutline/SourceOutline";
import QuickOpenButton from "./QuickOpenButton";
import SourcesTree from "./SourcesTree";

import { Accordion, AccordionPane } from "@recordreplay/accordion";

export default function PrimaryPanes() {
  const [outlineExpanded, setOutlineExpanded] = useGraphQLUserData(
    "layout_debuggerOutlineExpanded"
  );
  const [sourcesCollapsed, setSourcesCollapsed] = useGraphQLUserData("layout_sourcesCollapsed");
  const [enableLargeText] = useGraphQLUserData("global_enableLargeText");

  // Add the useNag hook and useEffect block
  const [, dismissInspectElementNag] = useNag(Nag.INSPECT_ELEMENT);

  useEffect(() => {
    dismissInspectElementNag();
  }, [dismissInspectElementNag]);

  return (
    <Accordion>
      <AccordionPane
        header="Sources"
        // ExperimentFeature: LargeText Logic
        className={classnames("sources-pane", enableLargeText ? "text-base" : "text-xs")}
        expanded={!sourcesCollapsed}
        onToggle={() => setSourcesCollapsed(!sourcesCollapsed)}
        initialHeight={400}
        button={<QuickOpenButton />}
      >
        <SourcesTree />
      </AccordionPane>
      <AccordionPane
        header="Outline"
        className="outlines-pane"
        expanded={!!outlineExpanded}
        onToggle={() => setOutlineExpanded(!outlineExpanded)}
      >
        <Outline />
      </AccordionPane>
    </Accordion>
  );
}

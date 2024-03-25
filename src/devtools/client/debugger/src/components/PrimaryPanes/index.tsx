import classnames from "classnames";

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

import classnames from "classnames";

import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { useContext, useState } from "react";

import Outline from "../SourceOutline/SourceOutline";
import QuickOpenButton from "./QuickOpenButton";
import SourcesTree from "./SourcesTree";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { Accordion, AccordionPane } from "@recordreplay/accordion";

export default function PrimaryPanes() {
  const [outlineExpanded, setOutlineExpanded] = useGraphQLUserData(
    "layout_debuggerOutlineExpanded"
  );
  const [sourcesCollapsed, setSourcesCollapsed] = useGraphQLUserData("layout_sourcesCollapsed");
  const [enableLargeText] = useGraphQLUserData("global_enableLargeText");

  const [supplementalSourcesCollapsed, setSupplementalSourcesCollapsed] = useState(sourcesCollapsed);
  const replayClient = useContext(ReplayClientContext);

  const sourcePanes = [];

  sourcePanes.push(
    <AccordionPane
      header="Sources"
      // ExperimentFeature: LargeText Logic
      className={classnames("sources-pane", enableLargeText ? "text-base" : "text-xs")}
      expanded={!sourcesCollapsed}
      onToggle={() => setSourcesCollapsed(!sourcesCollapsed)}
      initialHeight={400}
      button={<QuickOpenButton />}
    >
      <SourcesTree supplementalIndex={0}/>
    </AccordionPane>
  );

  for (let i = 0; i < replayClient.numSupplementalRecordings(); i++) {
      sourcePanes.push(
        <AccordionPane
          header="Backend Sources"
          // ExperimentFeature: LargeText Logic
          className={classnames("sources-pane", enableLargeText ? "text-base" : "text-xs")}
          expanded={!supplementalSourcesCollapsed}
          onToggle={() => setSupplementalSourcesCollapsed(!supplementalSourcesCollapsed)}
          initialHeight={200}
          button={<QuickOpenButton />}
        >
          <SourcesTree supplementalIndex={i + 1}/>
        </AccordionPane>
      );
    }

  return (
    <Accordion>
      {...sourcePanes as any}
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

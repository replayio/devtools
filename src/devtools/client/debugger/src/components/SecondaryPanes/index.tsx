import { useState } from "react";

import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { useAppSelector } from "ui/setup/hooks";

import { getExecutionPoint, getTime } from "../../selectors";
import BreakpointsPane from "./BreakpointsPane";
import CommandBar from "./CommandBar";
import NewFrames from "./Frames/NewFrames";
import FrameTimeline from "./FrameTimeline";
import LogpointsPane from "./LogpointsPane";
import NewScopes from "./NewScopes";
import { DepGraphPrototypePanel } from "./ReactComponentStack";

import { Accordion, AccordionPane } from "@recordreplay/accordion";

export default function SecondaryPanes() {
  const currentPoint = useAppSelector(getExecutionPoint);
  const currentTime = useAppSelector(getTime);

  const [scopesVisible, setScopesVisible] = useGraphQLUserData("layout_scopesPanelExpanded");
  const [callStackVisible, setCallStackVisible] = useGraphQLUserData(
    "layout_callStackPanelExpanded"
  );
  const [breakpointsVisible, setBreakpointsVisible] = useGraphQLUserData(
    "layout_breakpointsPanelExpanded"
  );
  const [logpointsVisible, setLogpointsVisible] = useGraphQLUserData(
    "layout_logpointsPanelExpanded"
  );
  const [reactStackVisible, setReactStackVisible] = useState(false);

  return (
    <div className="secondary-panes-wrapper">
      <CommandBar />
      <FrameTimeline />
      <Accordion>
        <AccordionPane
          header="Print Statements"
          className="breakpoints-pane"
          expanded={logpointsVisible}
          onToggle={() => setLogpointsVisible(!logpointsVisible)}
        >
          <LogpointsPane />
        </AccordionPane>
        <AccordionPane
          header="Breakpoints"
          className="breakpoints-pane"
          expanded={breakpointsVisible}
          onToggle={() => setBreakpointsVisible(!breakpointsVisible)}
        >
          <BreakpointsPane />
        </AccordionPane>
        <AccordionPane
          header="Call Stack"
          className="call-stack-pane"
          expanded={callStackVisible}
          onToggle={() => setCallStackVisible(!callStackVisible)}
        >
          {currentPoint && <NewFrames point={currentPoint} time={currentTime} panel="debugger" />}
        </AccordionPane>
        <AccordionPane
          header="Dependency Graph Prototype"
          className="react-component-stack-pane"
          expanded={reactStackVisible}
          onToggle={() => setReactStackVisible(!reactStackVisible)}
        >
          {currentPoint && <DepGraphPrototypePanel />}
        </AccordionPane>
        <AccordionPane
          header="Scopes"
          className="scopes-pane"
          expanded={scopesVisible}
          onToggle={() => setScopesVisible(!scopesVisible)}
        >
          <NewScopes />
        </AccordionPane>
      </Accordion>
    </div>
  );
}

import { TimeStampedPoint } from "@replayio/protocol";
import { useMemo, useState } from "react";

import { ReactComponentStack } from "devtools/client/debugger/src/components/SecondaryPanes/DependencyGraph/ReactComponentStack";
import { DependencyGraphMode } from "shared/client/types";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { useAppSelector } from "ui/setup/hooks";

import { getExecutionPoint, getTime } from "../../selectors";
import CommandBar from "./CommandBar";
import { DependencyGraph } from "./DependencyGraph/DependencyGraph";
import NewFrames from "./Frames/NewFrames";
import FrameTimeline from "./FrameTimeline";
import NewScopes from "./NewScopes";
import LogpointsPane from "./Points/LogpointsPane";

import { Accordion, AccordionPane } from "@recordreplay/accordion";

export default function SecondaryPanes() {
  const currentPoint = useAppSelector(getExecutionPoint);
  const currentTime = useAppSelector(getTime);

  const timeStampedPoint = useMemo<TimeStampedPoint | null>(
    () =>
      currentPoint != null && currentTime != null
        ? { point: currentPoint, time: currentTime }
        : null,
    [currentPoint, currentTime]
  );

  const [scopesVisible, setScopesVisible] = useGraphQLUserData("layout_scopesPanelExpanded");
  const [callStackVisible, setCallStackVisible] = useGraphQLUserData(
    "layout_callStackPanelExpanded"
  );
  const [logpointsVisible, setLogpointsVisible] = useGraphQLUserData(
    "layout_logpointsPanelExpanded"
  );
  const [dependencyGraphVisible, setDependencyGraphVisible] = useState(false);
  const [reactDependencyGraphVisible, setReactDependencyGraphVisible] = useState(false);
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
          header="Call Stack"
          className="call-stack-pane"
          expanded={callStackVisible}
          onToggle={() => setCallStackVisible(!callStackVisible)}
        >
          {currentPoint && <NewFrames point={currentPoint} time={currentTime} panel="debugger" />}
        </AccordionPane>
        <AccordionPane
          header="React Component Stack"
          headerNode={
            <>
              <span className="img react !bg-primaryAccent" /> Component Stack{" "}
              <small className="text-warning">(experimental)</small>
            </>
          }
          className="react-component-stack-pane"
          expanded={reactStackVisible}
          onToggle={() => setReactStackVisible(!reactStackVisible)}
        >
          <ReactComponentStack timeStampedPoint={timeStampedPoint} />
        </AccordionPane>
        <AccordionPane
          header="React Dependency Graph"
          headerNode={
            <>
              <span className="img react !bg-primaryAccent" /> Dependency Graph{" "}
              <small className="text-warning">(experimental)</small>
            </>
          }
          className="react-dependency-graph-pane"
          expanded={reactDependencyGraphVisible}
          onToggle={() => setReactDependencyGraphVisible(!reactDependencyGraphVisible)}
        >
          <DependencyGraph
            mode={DependencyGraphMode.ReactParentRenders}
            point={timeStampedPoint?.point}
          />
        </AccordionPane>
        <AccordionPane
          header="Dependency Graph"
          headerNode={
            <>
              Dependency Graph <small className="text-warning">(experimental)</small>
            </>
          }
          className="dependency-graph-pane"
          expanded={dependencyGraphVisible}
          onToggle={() => setDependencyGraphVisible(!dependencyGraphVisible)}
        >
          <DependencyGraph point={timeStampedPoint?.point} />
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

import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { getCurrentPoint } from "ui/actions/app";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

import BreakpointsPane from "./BreakpointsPane";
import CommandBar from "./CommandBar";
import NewFrames from "./Frames/NewFrames";
import FrameTimeline from "./FrameTimeline";
import LogpointsPane from "./LogpointsPane";
import NewScopes from "./NewScopes";

import { Accordion, AccordionPane } from "@recordreplay/accordion";

export default function SecondaryPanes() {
  const currentPoint = useAppSelector(getCurrentPoint);
  const currentTime = useAppSelector(getCurrentTime);

  const [scopesVisible, setScopesVisible] = useGraphQLUserData("scopesVisible");
  const [callStackVisible, setCallStackVisible] = useGraphQLUserData("callStackVisible");
  const [breakpointsVisible, setBreakpointsVisible] = useGraphQLUserData("breakpointsVisible");
  const [logpointsVisible, setLogpointsVisible] = useGraphQLUserData("logpointsVisible");

  return (
    <div className="secondary-panes-wrapper">
      <CommandBar />
      <FrameTimeline />
      <Accordion>
        <AccordionPane
          header="Breakpoints"
          className="breakpoints-pane"
          expanded={breakpointsVisible}
          onToggle={() => setBreakpointsVisible(!breakpointsVisible)}
        >
          <BreakpointsPane />
        </AccordionPane>
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

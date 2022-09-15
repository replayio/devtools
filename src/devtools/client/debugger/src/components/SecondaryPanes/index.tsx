/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React from "react";

import { getTopFrame, getFramesLoading } from "../../selectors";
import LogpointsPane from "./LogpointsPane";
import BreakpointsPane from "./BreakpointsPane";
import Frames from "./Frames";
import NewFrames from "./Frames/NewFrames";
import { Accordion, AccordionPane } from "@recordreplay/accordion";
import CommandBar from "./CommandBar";
import FrameTimeline from "./FrameTimeline";
import Scopes from "./Scopes";
import NewScopes from "./NewScopes";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { useDebuggerPrefs } from "../../utils/prefs";
import { features } from "ui/utils/prefs";

export default function SecondaryPanes() {
  const hasFrames = useAppSelector((state: UIState) => !!getTopFrame(state));
  const framesLoading = useAppSelector(getFramesLoading);
  const { value: scopesExpanded, update: updateScopesExpanded } =
    useDebuggerPrefs("scopes-visible");
  const { value: callstackVisible, update: updateCallstackVisible } =
    useDebuggerPrefs("call-stack-visible");
  const { value: breakpointsVisible, update: updateBreakpointsVisible } =
    useDebuggerPrefs("breakpoints-visible");
  const { value: logpointsVisible, update: updateLogpointsVisible } =
    useDebuggerPrefs("logpoints-visible");

  return (
    <div className="secondary-panes-wrapper">
      <CommandBar />
      <FrameTimeline />
      <Accordion>
        <AccordionPane
          header="Breakpoints"
          className="breakpoints-pane"
          expanded={breakpointsVisible}
          onToggle={() => updateBreakpointsVisible(!breakpointsVisible)}
        >
          <BreakpointsPane />
        </AccordionPane>
        <AccordionPane
          header="Print Statements"
          className="breakpoints-pane"
          expanded={logpointsVisible}
          onToggle={() => updateLogpointsVisible(!logpointsVisible)}
        >
          <LogpointsPane />
        </AccordionPane>
        <AccordionPane
          header="Call Stack"
          className="call-stack-pane"
          expanded={callstackVisible}
          onToggle={() => updateCallstackVisible(!callstackVisible)}
        >
          {features.legacyFramesPanel ? (
            <Frames panel="debugger" />
          ) : (
            <NewFrames panel="debugger" />
          )}
        </AccordionPane>
        <AccordionPane
          header="Scopes"
          className="scopes-pane"
          expanded={scopesExpanded}
          onToggle={() => updateScopesExpanded(!scopesExpanded)}
        >
          {features.legacyFramesPanel ? <Scopes /> : <NewScopes />}
        </AccordionPane>
      </Accordion>
    </div>
  );
}

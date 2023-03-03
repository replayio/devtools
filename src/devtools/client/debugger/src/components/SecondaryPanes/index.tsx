/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React from "react";

import { getCurrentPoint } from "ui/actions/app";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

import { useDebuggerPrefs } from "../../utils/prefs";
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
          {currentPoint && <NewFrames point={currentPoint} time={currentTime} panel="debugger" />}
        </AccordionPane>
        <AccordionPane
          header="Scopes"
          className="scopes-pane"
          expanded={scopesExpanded}
          onToggle={() => updateScopesExpanded(!scopesExpanded)}
        >
          <NewScopes />
        </AccordionPane>
      </Accordion>
    </div>
  );
}

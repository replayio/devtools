/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React from "react";

import { getTopFrame, getFramesLoading } from "../../selectors";
import LogpointsPane from "./LogpointsPane";
import BreakpointsPane from "./BreakpointsPane";
import Frames from "./Frames";
import { Accordion, AccordionPane } from "@recordreplay/accordion";
import CommandBar from "./CommandBar";
import FrameTimeline from "./FrameTimeline";

import Scopes from "./Scopes";
import { useSelector } from "react-redux";
import { UIState } from "ui/state";
import { useDebuggerPrefs } from "../../utils/prefs";

export default function SecondaryPanes() {
  const hasFrames = useSelector((state: UIState) => !!getTopFrame(state));
  const framesLoading = useSelector(getFramesLoading);
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
          {hasFrames || framesLoading ? (
            <Frames panel="debugger" />
          ) : (
            <div className="text-themeBodyColor mx-2 mt-2 mb-4 space-y-3 whitespace-normal rounded-lg bg-themeTextFieldBgcolor p-3 text-center text-xs">
              Scopes are unavailable while not paused on a line of code
            </div>
          )}
        </AccordionPane>
        <AccordionPane
          header="Scopes"
          className="scopes-pane"
          expanded={scopesExpanded}
          onToggle={() => updateScopesExpanded(!scopesExpanded)}
        >
          {hasFrames ? (
            <Scopes />
          ) : (
            <div className="text-themeBodyColor mx-2 mt-2 mb-4 space-y-3 whitespace-normal rounded-lg bg-themeTextFieldBgcolor p-3 text-center text-xs">
              Scopes are unavailable while not paused on a line of code
            </div>
          )}
        </AccordionPane>
      </Accordion>
    </div>
  );
}

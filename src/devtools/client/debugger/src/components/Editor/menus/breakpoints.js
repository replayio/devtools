/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import actions from "../../../actions";
import { bindActionCreators } from "redux";
import { features } from "../../../utils/prefs";
import { formatKeyShortcut } from "../../../utils/text";

export const removeBreakpointItem = (cx, breakpoint, breakpointActions) => ({
  id: "node-menu-remove-breakpoint",
  label: L10N.getStr("editor.removeBreakpoint"),
  accesskey: L10N.getStr("shortcuts.toggleBreakpoint.accesskey"),
  disabled: false,
  click: () => breakpointActions.removeBreakpoint(cx, breakpoint),
  accelerator: formatKeyShortcut(L10N.getStr("toggleBreakpoint.key")),
});

export const editConditionalBreakpointItem = (location, breakpointActions) => ({
  id: "node-menu-edit-conditional-breakpoint",
  label: L10N.getStr("editor.editConditionBreakpoint"),
  accelerator: formatKeyShortcut(L10N.getStr("toggleCondPanel.breakpoint.key")),
  accesskey: L10N.getStr("editor.addConditionBreakpoint.accesskey"),
  disabled: false,
  click: () => breakpointActions.openConditionalPanel(location),
});

export const conditionalBreakpointItem = (breakpoint, location, breakpointActions) => {
  const {
    options: { condition },
  } = breakpoint;
  return condition
    ? editConditionalBreakpointItem(location, breakpointActions) : null;
};

export const editLogPointItem = (location, breakpointActions) => ({
  id: "node-menu-edit-log-point",
  label: L10N.getStr("editor.editLogPoint"),
  accesskey: L10N.getStr("editor.editLogPoint.accesskey"),
  disabled: false,
  click: () => breakpointActions.openConditionalPanel(location, true),
  accelerator: formatKeyShortcut(L10N.getStr("toggleCondPanel.logPoint.key")),
});

export const logPointItem = (breakpoint, location, breakpointActions) => {
  const {
    options: { logValue },
  } = breakpoint;
  return logValue
    ? editLogPointItem(location, breakpointActions)
    : addLogPointItem(location, breakpointActions);
};

export const toggleDisabledBreakpointItem = (cx, breakpoint, breakpointActions) => {
  return {
    accesskey: L10N.getStr("editor.disableBreakpoint.accesskey"),
    disabled: false,
    click: () => breakpointActions.toggleDisabledBreakpoint(cx, breakpoint),
    ...(breakpoint.disabled
      ? {
          id: "node-menu-enable-breakpoint",
          label: L10N.getStr("editor.enableBreakpoint"),
        }
      : {
          id: "node-menu-disable-breakpoint",
          label: L10N.getStr("editor.disableBreakpoint"),
        }),
  };
};

export function breakpointItems(cx, breakpoint, selectedLocation, breakpointActions) {
  const items = [
    removeBreakpointItem(cx, breakpoint, breakpointActions),
    toggleDisabledBreakpointItem(cx, breakpoint, breakpointActions),
  ];

  if (breakpoint.originalText.startsWith("debugger")) {
    items.push({ type: "separator" });
  }

  items.push(
    { type: "separator" },
    removeBreakpointsOnLineItem(cx, selectedLocation, breakpointActions),
    breakpoint.disabled
      ? enableBreakpointsOnLineItem(cx, selectedLocation, breakpointActions)
      : disableBreakpointsOnLineItem(cx, selectedLocation, breakpointActions),
    { type: "separator" }
  );

  items.push(conditionalBreakpointItem(breakpoint, selectedLocation, breakpointActions));
  items.push(logPointItem(breakpoint, selectedLocation, breakpointActions));

  return items;
}


// ToDo: Only enable if there are more than one breakpoints on a line?
export const removeBreakpointsOnLineItem = (cx, location, breakpointActions) => ({
  id: "node-menu-remove-breakpoints-on-line",
  label: L10N.getStr("breakpointMenuItem.removeAllAtLine.label"),
  accesskey: L10N.getStr("breakpointMenuItem.removeAllAtLine.accesskey"),
  disabled: false,
  click: () => breakpointActions.removeBreakpointsAtLine(cx, location.sourceId, location.line),
});

export const enableBreakpointsOnLineItem = (cx, location, breakpointActions) => ({
  id: "node-menu-remove-breakpoints-on-line",
  label: L10N.getStr("breakpointMenuItem.enableAllAtLine.label"),
  accesskey: L10N.getStr("breakpointMenuItem.enableAllAtLine.accesskey"),
  disabled: false,
  click: () => breakpointActions.enableBreakpointsAtLine(cx, location.sourceId, location.line),
});

export const disableBreakpointsOnLineItem = (cx, location, breakpointActions) => ({
  id: "node-menu-remove-breakpoints-on-line",
  label: L10N.getStr("breakpointMenuItem.disableAllAtLine.label"),
  accesskey: L10N.getStr("breakpointMenuItem.disableAllAtLine.accesskey"),
  disabled: false,
  click: () => breakpointActions.disableBreakpointsAtLine(cx, location.sourceId, location.line),
});

export function breakpointItemActions(dispatch) {
  return bindActionCreators(
    {
      removeBreakpoint: actions.removeBreakpoint,
      removeBreakpointsAtLine: actions.removeBreakpointsAtLine,
      enableBreakpointsAtLine: actions.enableBreakpointsAtLine,
      disableBreakpointsAtLine: actions.disableBreakpointsAtLine,
      disableBreakpoint: actions.disableBreakpoint,
      toggleDisabledBreakpoint: actions.toggleDisabledBreakpoint,
      toggleBreakpointsAtLine: actions.toggleBreakpointsAtLine,
      setBreakpointOptions: actions.setBreakpointOptions,
      openConditionalPanel: actions.openConditionalPanel,
    },
    dispatch
  );
}

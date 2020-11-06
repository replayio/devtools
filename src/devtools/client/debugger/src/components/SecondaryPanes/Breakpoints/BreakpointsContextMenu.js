/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { buildMenu, showMenu } from "devtools-contextmenu";
import { features } from "../../../utils/prefs";

export default function showContextMenu(props) {
  const {
    cx,
    breakpoint,
    breakpoints,
    removeBreakpoint,
    removeBreakpoints,
    removeAllBreakpoints,
    toggleBreakpoints,
    toggleAllBreakpoints,
    toggleDisabledBreakpoint,
    setBreakpointOptions,
    contextMenuEvent,
  } = props;

  contextMenuEvent.preventDefault();

  const deleteSelfLabel = L10N.getStr("breakpointMenuItem.deleteSelf2.label");
  const deleteAllLabel = L10N.getStr("breakpointMenuItem.deleteAll2.label");
  const deleteOthersLabel = L10N.getStr("breakpointMenuItem.deleteOthers2.label");
  const enableSelfLabel = L10N.getStr("breakpointMenuItem.enableSelf2.label");
  const enableAllLabel = L10N.getStr("breakpointMenuItem.enableAll2.label");
  const enableOthersLabel = L10N.getStr("breakpointMenuItem.enableOthers2.label");
  const disableSelfLabel = L10N.getStr("breakpointMenuItem.disableSelf2.label");
  const disableAllLabel = L10N.getStr("breakpointMenuItem.disableAll2.label");
  const disableOthersLabel = L10N.getStr("breakpointMenuItem.disableOthers2.label");
  const enableDbgStatementLabel = L10N.getStr("breakpointMenuItem.enabledbg.label");
  const disableDbgStatementLabel = L10N.getStr("breakpointMenuItem.disabledbg.label");

  const deleteSelfKey = L10N.getStr("breakpointMenuItem.deleteSelf2.accesskey");
  const deleteAllKey = L10N.getStr("breakpointMenuItem.deleteAll2.accesskey");
  const deleteOthersKey = L10N.getStr("breakpointMenuItem.deleteOthers2.accesskey");
  const enableSelfKey = L10N.getStr("breakpointMenuItem.enableSelf2.accesskey");
  const enableAllKey = L10N.getStr("breakpointMenuItem.enableAll2.accesskey");
  const enableOthersKey = L10N.getStr("breakpointMenuItem.enableOthers2.accesskey");
  const disableSelfKey = L10N.getStr("breakpointMenuItem.disableSelf2.accesskey");
  const disableAllKey = L10N.getStr("breakpointMenuItem.disableAll2.accesskey");
  const disableOthersKey = L10N.getStr("breakpointMenuItem.disableOthers2.accesskey");

  const selectedLocation = breakpoint.location;
  const otherBreakpoints = breakpoints.filter(b => b.id !== breakpoint.id);
  const enabledBreakpoints = breakpoints.filter(b => !b.disabled);
  const disabledBreakpoints = breakpoints.filter(b => b.disabled);
  const otherEnabledBreakpoints = breakpoints.filter(b => !b.disabled && b.id !== breakpoint.id);
  const otherDisabledBreakpoints = breakpoints.filter(b => b.disabled && b.id !== breakpoint.id);

  const deleteSelfItem = {
    id: "node-menu-delete-self",
    label: deleteSelfLabel,
    accesskey: deleteSelfKey,
    disabled: false,
    click: () => {
      removeBreakpoint(cx, breakpoint);
    },
  };

  const deleteAllItem = {
    id: "node-menu-delete-all",
    label: deleteAllLabel,
    accesskey: deleteAllKey,
    disabled: false,
    click: () => removeAllBreakpoints(cx),
  };

  const deleteOthersItem = {
    id: "node-menu-delete-other",
    label: deleteOthersLabel,
    accesskey: deleteOthersKey,
    disabled: false,
    click: () => removeBreakpoints(cx, otherBreakpoints),
  };

  const enableSelfItem = {
    id: "node-menu-enable-self",
    label: enableSelfLabel,
    accesskey: enableSelfKey,
    disabled: false,
    click: () => {
      toggleDisabledBreakpoint(cx, breakpoint);
    },
  };

  const enableAllItem = {
    id: "node-menu-enable-all",
    label: enableAllLabel,
    accesskey: enableAllKey,
    disabled: false,
    click: () => toggleAllBreakpoints(cx, false),
  };

  const enableOthersItem = {
    id: "node-menu-enable-others",
    label: enableOthersLabel,
    accesskey: enableOthersKey,
    disabled: false,
    click: () => toggleBreakpoints(cx, false, otherDisabledBreakpoints),
  };

  const disableSelfItem = {
    id: "node-menu-disable-self",
    label: disableSelfLabel,
    accesskey: disableSelfKey,
    disabled: false,
    click: () => {
      toggleDisabledBreakpoint(cx, breakpoint);
    },
  };

  const disableAllItem = {
    id: "node-menu-disable-all",
    label: disableAllLabel,
    accesskey: disableAllKey,
    disabled: false,
    click: () => toggleAllBreakpoints(cx, true),
  };

  const disableOthersItem = {
    id: "node-menu-disable-others",
    label: disableOthersLabel,
    accesskey: disableOthersKey,
    click: () => toggleBreakpoints(cx, true, otherEnabledBreakpoints),
  };

  const enableDbgStatementItem = {
    id: "node-menu-enable-dbgStatement",
    label: enableDbgStatementLabel,
    disabled: false,
    click: () =>
      setBreakpointOptions(cx, selectedLocation, {
        ...breakpoint.options,
        condition: null,
      }),
  };

  const disableDbgStatementItem = {
    id: "node-menu-disable-dbgStatement",
    label: disableDbgStatementLabel,
    disabled: false,
    click: () =>
      setBreakpointOptions(cx, selectedLocation, {
        ...breakpoint.options,
        condition: "false",
      }),
  };

  const addLogPointItem = {
    id: "node-menu-add-log-point",
    label: L10N.getStr("editor.addLogPoint"),
    accesskey: L10N.getStr("editor.addLogPoint.accesskey"),
    disabled: false,
    click: () => {},
  };

  const editLogPointItem = {
    id: "node-menu-edit-log-point",
    label: L10N.getStr("editor.editLogPoint"),
    accesskey: L10N.getStr("editor.editLogPoint.accesskey"),
    disabled: false,
    click: () => {},
  };

  const removeLogPointItem = {
    id: "node-menu-remove-log",
    label: L10N.getStr("editor.removeLogPoint.label"),
    accesskey: L10N.getStr("editor.removeLogPoint.accesskey"),
    disabled: false,
    click: () =>
      setBreakpointOptions(cx, selectedLocation, {
        ...breakpoint.options,
        logValue: null,
      }),
  };

  const logPointItem = breakpoint.options.logValue ? editLogPointItem : addLogPointItem;

  const hideEnableSelfItem = !breakpoint.disabled;
  const hideEnableAllItem = disabledBreakpoints.length === 0;
  const hideEnableOthersItem = otherDisabledBreakpoints.length === 0;
  const hideDisableAllItem = enabledBreakpoints.length === 0;
  const hideDisableOthersItem = otherEnabledBreakpoints.length === 0;
  const hideDisableSelfItem = breakpoint.disabled;
  const hideEnableDbgStatementItem =
    !breakpoint.originalText.startsWith("debugger") ||
    (breakpoint.originalText.startsWith("debugger") && breakpoint.options.condition !== "false");
  const hideDisableDbgStatementItem =
    !breakpoint.originalText.startsWith("debugger") ||
    (breakpoint.originalText.startsWith("debugger") && breakpoint.options.condition === "false");
  const items = [
    { item: enableSelfItem, hidden: () => hideEnableSelfItem },
    { item: enableAllItem, hidden: () => hideEnableAllItem },
    { item: enableOthersItem, hidden: () => hideEnableOthersItem },
    {
      item: { type: "separator" },
      hidden: () => hideEnableSelfItem && hideEnableAllItem && hideEnableOthersItem,
    },
    { item: deleteSelfItem },
    { item: deleteAllItem },
    { item: deleteOthersItem, hidden: () => breakpoints.length === 1 },
    {
      item: { type: "separator" },
      hidden: () => hideDisableSelfItem && hideDisableAllItem && hideDisableOthersItem,
    },

    { item: disableSelfItem, hidden: () => hideDisableSelfItem },
    { item: disableAllItem, hidden: () => hideDisableAllItem },
    { item: disableOthersItem, hidden: () => hideDisableOthersItem },
    {
      item: { type: "separator" },
    },
    {
      item: enableDbgStatementItem,
      hidden: () => hideEnableDbgStatementItem,
    },
    {
      item: disableDbgStatementItem,
      hidden: () => hideDisableDbgStatementItem,
    },
    {
      item: { type: "separator" },
      hidden: () => hideDisableDbgStatementItem && hideEnableDbgStatementItem,
    },
    {
      item: logPointItem,
      hidden: () => !features.logPoints,
    },
    {
      item: removeLogPointItem,
      hidden: () => !features.logPoints || !breakpoint.options.logValue,
    },
  ];

  showMenu(contextMenuEvent, buildMenu(items));
  return null;
}

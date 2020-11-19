/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { buildMenu, showMenu } from "devtools-contextmenu";

import actions from "../../../actions";

export default function showContextMenu(props) {
  const {
    cx,
    source,
    breakpointsForSource,
    disableBreakpointsInSource,
    enableBreakpointsInSource,
    removeBreakpointsInSource,
    contextMenuEvent,
  } = props;

  contextMenuEvent.preventDefault();

  const enableInSourceLabel = "Enable breakpoints";
  const disableInSourceLabel = "Disable breakpoints";
  const removeInSourceLabel = "Remove breakpoints";
  const enableInSourceKey = "E";
  const disableInSourceKey = "D";
  const removeInSourceKey = "R";

  const disableInSourceItem = {
    id: "node-menu-disable-in-source",
    label: disableInSourceLabel,
    accesskey: disableInSourceKey,
    disabled: false,
    click: () => disableBreakpointsInSource(cx, source),
  };

  const enableInSourceItem = {
    id: "node-menu-enable-in-source",
    label: enableInSourceLabel,
    accesskey: enableInSourceKey,
    disabled: false,
    click: () => enableBreakpointsInSource(cx, source),
  };

  const removeInSourceItem = {
    id: "node-menu-enable-in-source",
    label: removeInSourceLabel,
    accesskey: removeInSourceKey,
    disabled: false,
    click: () => removeBreakpointsInSource(cx, source),
  };

  const hideDisableInSourceItem = breakpointsForSource.every(breakpoint => breakpoint.disabled);
  const hideEnableInSourceItem = breakpointsForSource.every(breakpoint => !breakpoint.disabled);

  const items = [
    { item: disableInSourceItem, hidden: () => hideDisableInSourceItem },
    { item: enableInSourceItem, hidden: () => hideEnableInSourceItem },
    { item: removeInSourceItem, hidden: () => false },
  ];

  showMenu(contextMenuEvent, buildMenu(items));
}

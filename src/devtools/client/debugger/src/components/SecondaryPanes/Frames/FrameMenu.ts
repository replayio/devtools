/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { showMenu } from "devtools/shared/contextmenu";
import { copyToTheClipboard } from "../../../utils/clipboard";
import kebabCase from "lodash/kebabCase";

import type { PauseFrame } from "devtools/client/debugger/src/reducers/pause";

function formatMenuElement(labelString: string, click: () => void, disabled = false) {
  const label = window.L10N.getStr(labelString);
  const accesskey = window.L10N.getStr(`${labelString}.accesskey`);
  const id = `node-menu-${kebabCase(label)}`;
  return {
    id,
    label,
    accesskey,
    disabled,
    click,
  };
}

function copySourceElement(url: string) {
  return formatMenuElement("copySourceUri2", () => copyToTheClipboard(url));
}

function copyStackTraceElement(copyStackTrace: () => void) {
  return formatMenuElement("copyStackTrace", () => copyStackTrace());
}

function toggleFrameworkGroupingElement(
  toggleFrameworkGrouping: () => void,
  frameworkGroupingOn: boolean
) {
  const actionType = frameworkGroupingOn ? "framework.disableGrouping" : "framework.enableGrouping";

  return formatMenuElement(actionType, () => toggleFrameworkGrouping());
}

export default function FrameMenu(
  frame: PauseFrame,
  frameworkGroupingOn: boolean,
  callbacks: { toggleFrameworkGrouping: () => void; copyStackTrace: () => void },
  event: React.MouseEvent
) {
  event.stopPropagation();
  event.preventDefault();

  const menuOptions = [];

  const toggleFrameworkElement = toggleFrameworkGroupingElement(
    callbacks.toggleFrameworkGrouping,
    frameworkGroupingOn
  );
  menuOptions.push(toggleFrameworkElement);

  const { source } = frame;
  if (source) {
    const copySourceUri2 = copySourceElement(source.url!);
    menuOptions.push(copySourceUri2);
  }

  const copyStackTraceItem = copyStackTraceElement(callbacks.copyStackTrace);

  menuOptions.push(copyStackTraceItem);

  showMenu(event, menuOptions);
}

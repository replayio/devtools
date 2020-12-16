/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import actions from "devtools/client/webconsole/actions/index";

/**
 * @memberof actions/toolbox
 * @static
 */
export function openLink(url) {
  return ({ toolbox }) => {
    toolbox.getPanel("debugger")?.openLink(url);
  };
}

export function evaluateInConsole(inputString) {
  return () => {
    dispatch(actions.evaluateExpression(inputString));
  };
}

export function openElementInInspectorCommand(grip) {
  return ({ toolbox }) => {
    toolbox.getPanel("debugger")?.openElementInInspector(grip);
  };
}

export function openInspector(grip) {
  return ({ toolbox }) => {
    toolbox.getPanel("debugger")?.openInspector();
  };
}

export function highlightDomElement(grip) {
  return ({ toolbox }) => {
    toolbox.getPanel("debugger")?.highlightDomElement(grip);
  };
}

export function unHighlightDomElement(grip) {
  return ({ toolbox }) => {
    toolbox.getPanel("debugger")?.unHighlightDomElement(grip);
  };
}

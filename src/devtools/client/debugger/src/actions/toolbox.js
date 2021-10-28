/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * @memberof actions/toolbox
 * @static
 */
export function openLink(url) {
  return ({ toolbox }) => {
    toolbox.getPanel("debugger")?.openLink(url);
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
  return async ({ toolbox }) => {
    const nodeFront = grip.getNodeFront();
    toolbox.getPanel("debugger")?.highlightDomElement(nodeFront);
  };
}

export function unHighlightDomElement(grip) {
  return ({ toolbox }) => {
    toolbox.getPanel("debugger")?.unHighlightDomElement(grip);
  };
}

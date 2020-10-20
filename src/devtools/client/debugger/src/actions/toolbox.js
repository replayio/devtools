/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * @memberof actions/toolbox
 * @static
 */
export function openLink(url) {
  return async function ({ panels }) {
    return panels.debugger?.openLink(url);
  };
}

export function evaluateInConsole(inputString) {
  return async ({ panels }) => {
    return panels.debugger?.openConsoleAndEvaluate(inputString);
  };
}

export function openElementInInspectorCommand(grip) {
  return async ({ panels }) => {
    return panels.debugger?.openElementInInspector(grip);
  };
}

export function openInspector(grip) {
  return async ({ panels }) => {
    return panels.debugger?.openInspector();
  };
}

export function highlightDomElement(grip) {
  return async ({ panels }) => {
    return panels.debugger?.highlightDomElement(grip);
  };
}

export function unHighlightDomElement(grip) {
  return async ({ panels }) => {
    return panels.debugger?.unHighlightDomElement(grip);
  };
}

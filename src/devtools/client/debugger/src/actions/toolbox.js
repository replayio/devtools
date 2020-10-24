/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * @memberof actions/toolbox
 * @static
 */
export function openLink(url) {
  return function () {
    gToolbox.getPanel("debugger")?.openLink(url);
  };
}

export function evaluateInConsole(inputString) {
  return function () {
    gToolbox.getPanel("debugger")?.openConsoleAndEvaluate(inputString);
  };
}

export function openElementInInspectorCommand(grip) {
  return function () {
    gToolbox.getPanel("debugger")?.openElementInInspector(grip);
  };
}

export function openInspector(grip) {
  return function () {
    gToolbox.getPanel("debugger")?.openInspector();
  };
}

export function highlightDomElement(grip) {
  return function () {
    gToolbox.getPanel("debugger")?.highlightDomElement(grip);
  };
}

export function unHighlightDomElement(grip) {
  return function () {
    gToolbox.getPanel("debugger")?.unHighlightDomElement(grip);
  };
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

export function highlightDomElement(grip) {
  return ({ hud }) => {
    const highlighter = hud.getHighlighter();
    if (highlighter) {
      highlighter.highlight(grip);
    }
  };
}

export function unHighlightDomElement(grip) {
  return ({ hud }) => {
    const highlighter = hud.getHighlighter();
    if (highlighter) {
      highlighter.unhighlight(grip);
    }
  };
}

// NOTE these methods are proxied currently because the
// service container is passed down the tree. These methods should eventually
// be moved to redux actions.
export function openLink(url, e) {
  return ({ hud }) => {
    hud.openLink(url, e);
  };
}

export function openNodeInInspector(grip) {
  return ({ hud }) => {
    hud.openNodeInInspector(grip);
  };
}

export function getInputSelection() {
  return ({ hud }) => {
    hud.getInputSelection();
  };
}

export function focusInput() {
  return ({ hud }) => {
    hud.focusInput();
  };
}

export function setInputValuevalue() {
  return ({ hud }) => {
    hud.setInputValue(value);
  };
}

export function onMessageHover(type, message) {
  return ({ webConsoleUI }) => {
    webConsoleUI.onMessageHover(type, message);
  };
}

export function getJsTermTooltipAnchor() {
  return ({ webConsoleUI }) => {
    webConsoleUI.getJsTermTooltipAnchor();
  };
}

export function requestData(id, type) {
  return ({ webconsoleUI }) => {
    webconsoleUI.requestData(id, type);
  };
}

export function jumpToExecutionPoint(point, time, hasFrames) {
  return ({ toolbox }) => {
    toolbox.threadFront.timeWarp(point, time, hasFrames);
  };
}

export function onViewSourceInDebugger(frame) {
  return ({ toolbox }) => {
    toolbox.viewSourceInDebugger(frame.url, frame.line, frame.column, frame.scriptId);
  };
}

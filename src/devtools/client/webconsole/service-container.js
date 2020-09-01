/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function setupServiceContainer({ webConsoleUI, hud, toolbox, webConsoleWrapper }) {
  const serviceContainer = {
    // NOTE these methods are proxied currently because the
    // service container is passed down the tree. These methods should eventually
    // be moved to redux actions.
    openLink: (url, e) => hud.openLink(url, e),
    openNodeInInspector: grip => hud.openNodeInInspector(grip),
    getInputSelection: () => hud.getInputSelection(),
    onViewSource: frame => hud.viewSource(frame.url, frame.line),
    focusInput: () => hud.focusInput(),
    setInputValue: value => hud.setInputValue(value),
    canRewind: () => hud.canRewind(),
    onMessageHover: (type, message) => webConsoleUI.onMessageHover(type, message),
    getLongString: grip => webConsoleUI.getLongString(grip),
    getJsTermTooltipAnchor: () => webConsoleUI.getJsTermTooltipAnchor(),
    emitForTests: (event, value) => webConsoleUI.emitForTests(event, value),
    attachRefToWebConsoleUI: (id, node) => webConsoleUI.attachRef(id, node),
    requestData: (id, type) => webConsoleWrapper.requestData(id, type),
    createElement: nodename => webConsoleWrapper.createElement(nodename),
  };

  if (toolbox) {
    const { highlight, unhighlight } = toolbox.getHighlighter();

    Object.assign(serviceContainer, {
      sourceMapService: toolbox.sourceMapURLService,
      highlightDomElement: highlight,
      unHighlightDomElement: unhighlight,
      jumpToExecutionPoint: (point, time, hasFrames) =>
        toolbox.threadFront.timeWarp(point, time, hasFrames),
      onViewSourceInDebugger: frame => hud.onViewSourceInDebugger(frame),
      onViewSourceInStyleEditor: frame => hud.onViewSourceInStyleEditor(frame),
    });
  }

  return serviceContainer;
}

module.exports.setupServiceContainer = setupServiceContainer;

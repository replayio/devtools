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
    focusInput: () => hud.focusInput(),
    setInputValue: value => hud.setInputValue(value),
    onMessageHover: (type, message) => webConsoleUI.onMessageHover(type, message),
    getJsTermTooltipAnchor: () => webConsoleUI.getJsTermTooltipAnchor(),
    attachRefToWebConsoleUI: (id, node) => webConsoleUI.attachRef(id, node),
    requestData: (id, type) => webConsoleWrapper.requestData(id, type),
    createElement: nodename => webConsoleWrapper.createElement(nodename),
  };

  if (toolbox) {
    const { highlight, unhighlight } = toolbox.getHighlighter();

    Object.assign(serviceContainer, {
      highlightDomElement: highlight,
      unHighlightDomElement: unhighlight,
      jumpToExecutionPoint: (point, time, hasFrames) =>
        toolbox.threadFront.timeWarp(point, time, hasFrames),
      onViewSourceInDebugger: frame => hud.onViewSourceInDebugger(frame),
    });
  }

  return serviceContainer;
}

module.exports.setupServiceContainer = setupServiceContainer;

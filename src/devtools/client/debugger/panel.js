/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { assert } from "protocol/utils";
import { openDocLink } from "devtools/client/shared/link";
import { onConnect } from "devtools/client/debugger/src/client";

export class DebuggerPanel {
  constructor(toolbox) {
    this.toolbox = toolbox;
  }

  async open() {
    const { actions, store, selectors, client } = onConnect();

    this._actions = actions;
    this._store = store;
    this._selectors = selectors;
    this._client = client;
    this.isReady = true;

    return this;
  }

  getVarsForTests() {
    assert(this.isReady);
    return {
      store: this._store,
      selectors: this._selectors,
      actions: this._actions,
      client: this._client,
    };
  }

  _getState() {
    return this._store.getState();
  }

  async openLink(url) {
    const source = this._selectors.getSourceByURL(this._store.getState(), url);
    if (source?.id) {
      this.selectSource(source.id);
    } else {
      openDocLink(url);
    }
  }

  async openInspector() {
    this.toolbox.selectTool("inspector");
  }

  async openElementInInspector(valueFront) {
    this.toolbox.selectTool("inspector");

    const pause = valueFront.getPause();
    const nodeFront = await pause.ensureDOMFrontAndParents(valueFront._object.objectId);

    await this.toolbox.selection.setNodeFront(nodeFront, {
      reason: "debugger",
    });
  }

  async highlightDomElement(gripOrFront) {
    if (!this._highlight) {
      const highlighter = this.toolbox.getHighlighter();
      this._highlight = node => highlighter.highlight(node);
      this._unhighlight = () => highlighter.unhighlight();
    }

    return this._highlight(gripOrFront);
  }

  unHighlightDomElement() {
    if (!this._unhighlight) {
      return;
    }

    const forceUnHighlightInTest = true;
    return this._unhighlight(forceUnHighlightInTest);
  }

  getFrames() {
    const frames = this._selectors.getFrames(this._getState());

    // Frames is null when the debugger is not paused.
    if (!frames) {
      return {
        frames: [],
        selected: -1,
      };
    }

    const selectedFrame = this._selectors.getSelectedFrame(this._getState());
    const selected = frames.findIndex(frame => frame.id == selectedFrame.id);

    frames.forEach(frame => {
      frame.actor = frame.id;
    });

    return { frames, selected };
  }

  // Retrieves the debugger's currently selected frame front
  getFrameId() {
    const state = this.getFrames();
    const frame = state?.frames[state?.selected];
    return frame ? { asyncIndex: frame.asyncIndex, frameId: frame.protocolId } : { asyncIndex: 0 };
  }

  isPaused() {
    return this._selectors.getIsPaused(this._getState());
  }

  async selectSource(sourceId, line, column) {
    const cx = this._selectors.getContext(this._getState());
    const location = { sourceId, line, column };

    this._actions.showSource(cx, sourceId);
    await this._actions.selectSource(cx, sourceId, location);
  }

  getSourceByActorId(sourceId) {
    return this._selectors.getSourceByActorId(this._getState(), sourceId);
  }

  getSourceByURL(sourceURL) {
    return this._selectors.getSourceByURL(this._getState(), sourceURL);
  }

  destroy() {
    this.panelWin.Debugger.destroy();
    this.emit("destroyed");
  }
}

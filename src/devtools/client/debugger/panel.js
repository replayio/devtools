/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { defer, assert } from "protocol/utils";
import { resizeBreakpointGutter } from "./src/utils/ui";
import { openDocLink } from "devtools/client/shared/link";
import { onConnect } from "devtools/client/debugger/src/client";

async function getNodeFront(gripOrFront, toolbox) {
  // Given a NodeFront
  if ("actorID" in gripOrFront) {
    return new Promise(resolve => resolve(gripOrFront));
  }

  const inspectorFront = await toolbox.target.getFront("inspector");
  return inspectorFront.getNodeFrontFromNodeGrip(gripOrFront);
}

export class DebuggerPanel {
  constructor(toolbox) {
    this.toolbox = toolbox;
    this.readyWaiter = defer();
  }

  async open() {
    const { actions, store, selectors, client } = await onConnect();

    this._actions = actions;
    this._store = store;
    this._selectors = selectors;
    this._client = client;
    this.isReady = true;
    this.readyWaiter.resolve();

    return this;
  }

  refresh() {
    if (!this.editor) {
      return;
    }

    // CodeMirror does not update properly when it is hidden. This method has
    // a few workarounds to get the editor to behave as expected when switching
    // to the debugger from another panel and the selected location has changed.
    const { codeMirror } = this.editor.state.editor;

    // Update CodeMirror by dispatching a resize event to the window. CodeMirror
    // also has a refresh() method but it did not work as expected when testing.
    window.dispatchEvent(new Event("resize"));

    // After CodeMirror refreshes, scroll it to the selected location, unless
    // the user explicitly scrolled the editor since the location was selected.
    // In this case the editor will already be in the correct state, and we
    // don't want to undo the scrolling which the user did.
    const handler = () => {
      codeMirror.off("refresh", handler);
      setTimeout(() => {
        if (!this._selectors.selectedLocationHasScrolled(this._getState())) {
          const location = this._selectors.getSelectedLocation(this._getState());
          if (location) {
            const cx = this._selectors.getContext(this._getState());
            this._actions.selectLocation(cx, location);
          }
        }
        resizeBreakpointGutter(codeMirror);
      }, 0);
    };
    codeMirror.on("refresh", handler);
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

  getToolboxStore() {
    return this.toolbox.store;
  }

  openLink(url) {
    openDocLink(url);
  }

  async openConsoleAndEvaluate(input) {
    const { hud } = await this.toolbox.selectTool("console");
    hud.ui.wrapper.dispatchEvaluateExpression(input);
  }

  async openInspector() {
    this.toolbox.selectTool("inspector");
  }

  async openElementInInspector(gripOrFront) {
    const onSelectInspector = this.toolbox.selectTool("inspector");
    const onGripNodeToFront = getNodeFront(gripOrFront, this.toolbox);

    const [front, inspector] = await Promise.all([onGripNodeToFront, onSelectInspector]);

    const onInspectorUpdated = inspector.once("inspector-updated");
    const onNodeFrontSet = this.toolbox.selection.setNodeFront(front, {
      reason: "debugger",
    });

    return Promise.all([onNodeFrontSet, onInspectorUpdated]);
  }

  async highlightDomElement(gripOrFront) {
    if (!this._highlight) {
      const { highlight, unhighlight } = this.toolbox.getHighlighter();
      this._highlight = highlight;
      this._unhighlight = unhighlight;
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

  isPaused() {
    return this._selectors.getIsPaused(this._getState());
  }

  interrupt() {
    const cx = this._selectors.getThreadContext(this._getState());
    this._actions.breakOnNext(cx);
  }

  selectSourceURL(url, line, column) {
    const cx = this._selectors.getContext(this._getState());
    return this._actions.selectSourceURL(cx, url, { line, column });
  }

  previewPausedLocation(location) {
    return this._actions.previewPausedLocation(location);
  }

  clearPreviewPausedLocation() {
    return this._actions.clearPreviewPausedLocation();
  }

  async selectSource(sourceId, line, column) {
    const cx = this._selectors.getContext(this._getState());
    const location = { sourceId, line, column };

    await this._actions.selectSource(cx, sourceId, location);
  }

  canLoadSource(sourceId) {
    return this._selectors.canLoadSource(this._getState(), sourceId);
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

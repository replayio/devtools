/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Adapter for using server-side highlighter code.

import { ThreadFront } from "protocol/thread/thread";
import { NodeFront } from "protocol/thread/node";
import { NodeBoundsFront } from "protocol/thread/bounds";
import { BoxModelHighlighter } from "devtools/server/actors/highlighters/box-model";

class Highlighter {
  private boxModelHighlighter: BoxModelHighlighter | undefined;
  currentNode: NodeFront | NodeBoundsFront | null = null;
  private timeout: NodeJS.Timeout | undefined;

  constructor() {
    ThreadFront.on("paused", () => this.unhighlight());
  }

  async highlight(node: NodeFront | NodeBoundsFront, duration?: number) {
    if (!node) {
      return;
    }

    this.clearTimeout();
    if (duration) {
      this.timeout = setTimeout(() => this.unhighlight(), duration);
    }

    this.currentNode = node;
    if ("getBoxModel" in node) {
      await node.getBoxModel();
    }
    if (this.currentNode !== node) {
      return;
    }

    this.maybeDestroyBrokenHighlighter();
    this.maybeCreateNewHighlighter();

    this.boxModelHighlighter?.show(node);
  }

  unhighlight() {
    this.clearTimeout();
    this.maybeDestroyBrokenHighlighter();
    this.boxModelHighlighter?.hide();
    this.currentNode = null;
  }

  private clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }

  private maybeDestroyBrokenHighlighter() {
    if (!this.boxModelHighlighter) {
      return;
    }
    if (!document.getElementById("box-model-root")) {
      this.boxModelHighlighter.destroy();
      this.boxModelHighlighter = undefined;
    }
  }

  private maybeCreateNewHighlighter() {
    if (this.boxModelHighlighter) {
      return;
    }
    if (document.getElementById("highlighter-root")) {
      this.boxModelHighlighter = new BoxModelHighlighter();
    }
  }
}

export default new Highlighter();

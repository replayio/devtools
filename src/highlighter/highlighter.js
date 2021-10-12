/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Adapter for using server-side highlighter code.

const { BoxModelHighlighter } = require("devtools/server/actors/highlighters/box-model");

let gBoxModelHighlighter;

const Highlighter = {
  currentNode: null,

  async highlight(node) {
    if (!node) {
      return;
    }
    if (node.getBoxModel) {
      await node.getBoxModel();
    }

    if (gBoxModelHighlighter && !document.getElementById("box-model-root")) {
      gBoxModelHighlighter.destroy();
      gBoxModelHighlighter = undefined;
    }
    if (!gBoxModelHighlighter) {
      gBoxModelHighlighter = new BoxModelHighlighter();
    }
    gBoxModelHighlighter.show(node);
    this.currentNode = node;
  },

  unhighlight() {
    if (gBoxModelHighlighter) {
      gBoxModelHighlighter.hide();
    }
    this.currentNode = null;
  },
};

module.exports = Highlighter;

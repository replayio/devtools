/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Inspector } = require("./inspector");

function InspectorPanel(toolbox) {
  this._inspector = new Inspector(toolbox);
}
InspectorPanel.prototype = {
  open() {
    return this._inspector.init();
  },

  destroy() {
    return this._inspector.destroy();
  },
};
exports.InspectorPanel = InspectorPanel;

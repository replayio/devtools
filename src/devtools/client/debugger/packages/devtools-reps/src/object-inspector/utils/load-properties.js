/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const { getClosestGripNode, getValue } = require("./node");

function loadItemProperties(item) {
  const gripItem = getClosestGripNode(item);
  const value = getValue(gripItem);

  return value.loadChildren();
}

module.exports = {
  loadItemProperties,
};

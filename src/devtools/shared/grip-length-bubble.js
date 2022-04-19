/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const { ModePropType } = require("devtools/packages/devtools-reps/reps/array");
const { MODE } = require("devtools/packages/devtools-reps/reps/constants");
const { wrapRender } = require("devtools/packages/devtools-reps/reps/rep-utils");
const PropTypes = require("prop-types");
const dom = require("react-dom-factories");
const { span } = dom;

GripLengthBubble.propTypes = {
  getLength: PropTypes.func.isRequired,
  maxLengthMap: PropTypes.instanceOf(Map).isRequired,
  mode: ModePropType,
  object: PropTypes.object.isRequired,
  visibilityThreshold: PropTypes.number,
};

function GripLengthBubble(props) {
  const {
    object,
    mode = MODE.SHORT,
    visibilityThreshold = 2,
    maxLengthMap,
    getLength,
    showZeroLength = false,
  } = props;

  const length = getLength(object);
  const isEmpty = length === 0;
  const isObvious =
    [MODE.SHORT, MODE.LONG].includes(mode) &&
    length > 0 &&
    length <= maxLengthMap.get(mode) &&
    length <= visibilityThreshold;
  if ((isEmpty && !showZeroLength) || isObvious) {
    return "";
  }

  return span(
    {
      className: "objectLengthBubble",
    },
    `(${length})`
  );
}

module.exports = {
  lengthBubble: wrapRender(GripLengthBubble),
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const PropTypes = require("prop-types");
const dom = require("react-dom-factories");

MessageRepeat.displayName = "MessageRepeat";

MessageRepeat.propTypes = {
  repeat: PropTypes.number.isRequired,
};

function MessageRepeat(props) {
  const { repeat } = props;
  return dom.span(
    {
      className: "message-repeats",
      title: `${repeat} repeat${repeat === 1 ? "" : "s"}`,
    },
    repeat
  );
}

module.exports = MessageRepeat;

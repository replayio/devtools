/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { l10n } = require("devtools/client/webconsole/utils/messages");
const { PluralForm } = require("devtools/shared/plural-form");
const PropTypes = require("prop-types");
const dom = require("react-dom-factories");
const messageRepeatsTooltip = "#1 repeat;#1 repeats";

MessageRepeat.displayName = "MessageRepeat";

MessageRepeat.propTypes = {
  repeat: PropTypes.number.isRequired,
};

function MessageRepeat(props) {
  const { repeat } = props;
  return dom.span(
    {
      className: "message-repeats",
      title: PluralForm.get(repeat, messageRepeatsTooltip).replace("#1", repeat),
    },
    repeat
  );
}

module.exports = MessageRepeat;

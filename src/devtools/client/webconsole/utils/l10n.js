/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
function leftFillNum(num, targetLength) {
  return num.toString().padStart(targetLength, 0);
}

const l10n = {
  /**
   * Generates a formatted timestamp string for displaying in console messages.
   *
   * @param integer [milliseconds]
   *        Optional, allows you to specify the timestamp in milliseconds since
   *        the UNIX epoch.
   * @return string
   *         The timestamp formatted for display.
   */
  timestampString: function (milliseconds) {
    const d = new Date(milliseconds ? milliseconds : null);
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();
    const zeroPaddedMinutes = leftFillNum(minutes, 2);
    const zeroPaddedSeconds = leftFillNum(seconds, 2);
    return `${zeroPaddedMinutes}:${zeroPaddedSeconds}`;
  },
};

module.exports = l10n;

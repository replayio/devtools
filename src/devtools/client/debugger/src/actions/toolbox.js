/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * @memberof actions/toolbox
 * @static
 */
export function openLink(url) {
  return () => {
    console.log("openLink", url);
  };
}

export function openElementInInspectorCommand(grip) {
  return () => {
    console.log("openElementInInspectorCommand", grip);
  };
}

export function openInspector(grip) {
  return () => {
    console.log("openInspector", grip);
  };
}

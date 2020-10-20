/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { prefs, asyncStore, features } from "./prefs";

function getCM() {
  const cm = document.querySelector(".CodeMirror");
  return cm && cm.CodeMirror;
}

export function setupHelper() {
  const dbg = {
    prefs,
    asyncStore,
    features,
    getCM,
  };

  window.dbg = dbg;
}

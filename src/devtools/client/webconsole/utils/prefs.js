/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function getPrefsService(hud) {
  return {
    getBoolPref: (pref, deflt) => deflt,
    getIntPref: (pref, deflt) => deflt,
    setBoolPref: (pref, value) => {},
    setIntPref: (pref, value) => {},
    clearUserPref: pref => {},
  };
}

module.exports = {
  getPrefsService,
};

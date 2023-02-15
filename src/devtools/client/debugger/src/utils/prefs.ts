/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { useEffect, useState } from "react";

import { PrefsHelper } from "devtools/client/shared/prefs";
import Services, { pref } from "devtools/shared/services";

const { prefs: prefsService } = Services;

// Debugger prefs.
pref("devtools.debugger.outline-expanded", true);
pref("devtools.debugger.sources-collapsed", false);
pref("devtools.debugger.log-exceptions", false);
pref("devtools.debugger.call-stack-visible", true);
pref("devtools.debugger.scopes-visible", true);
pref("devtools.debugger.breakpoints-visible", true);
pref("devtools.debugger.logpoints-visible", true);
pref("devtools.debugger.event-listeners-visible", false);
pref("devtools.debugger.ui.framework-grouping-on", true);
pref("devtools.debugger.pending-selected-location", "{}");
pref("devtools.debugger.features.column-breakpoints", true);

export const prefs = new PrefsHelper("devtools", {
  outlineExpanded: ["Bool", "debugger.outline-expanded"],
  sourcesCollapsed: ["Bool", "debugger.sources-collapsed"],
  frameworkGroupingOn: ["Bool", "debugger.ui.framework-grouping-on"],
  pendingSelectedLocation: ["Json", "debugger.pending-selected-location"],
  debuggerPrefsSchemaVersion: ["Int", "debugger.prefs-schema-version"],
});

export const useDebuggerPrefs = (prefKey: string) => {
  const fullKey = `devtools.debugger.${prefKey}`;
  const [preference, setPreference] = useState(prefsService.getBoolPref(fullKey));

  useEffect(() => {
    const onUpdate = (prefs: typeof prefsService) => {
      setPreference(prefs.getBoolPref(fullKey));
    };

    prefsService.addObserver(fullKey, onUpdate, false);
    return () => prefsService.removeObserver(fullKey, onUpdate);
  }, [fullKey]);

  return {
    value: preference,
    update: (newValue: boolean) => {
      prefsService.setBoolPref(fullKey, newValue);
    },
  };
};

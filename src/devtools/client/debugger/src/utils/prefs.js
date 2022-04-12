/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { asyncStoreHelper } from "devtools/shared/async-store-helper";
import { PrefsHelper } from "devtools/client/shared/prefs";
import { useEffect, useState } from "react";

import Services, { prefs as prefsService } from "devtools/shared/services";

// Schema version to bump when the async store format has changed incompatibly
// and old stores should be cleared.
const prefsSchemaVersion = 11;
const { pref } = Services;

// Debugger prefs.
pref("devtools.browsertoolbox.fission", false);
pref("devtools.debugger.logging", false);
pref("devtools.debugger.timing", false);
pref("devtools.debugger.alphabetize-outline", false);
pref("devtools.debugger.outline-expanded", true);
pref("devtools.debugger.sources-collapsed", false);
pref("devtools.source-map.client-service.enabled", true);
pref("devtools.chrome.enabled", false);
pref("devtools.debugger.log-exceptions", false);
pref("devtools.debugger.call-stack-visible", true);
pref("devtools.debugger.scopes-visible", true);
pref("devtools.debugger.component-visible", false);
pref("devtools.debugger.workers-visible", false);
pref("devtools.debugger.breakpoints-visible", true);
pref("devtools.debugger.logpoints-visible", true);
pref("devtools.debugger.event-listeners-visible", false);
pref("devtools.debugger.start-panel-collapsed", false);
pref("devtools.debugger.end-panel-collapsed", false);
pref("devtools.debugger.start-panel-size", 300);
pref("devtools.debugger.end-panel-size", 300);
pref("devtools.debugger.tabsBlackBoxed", "[]");
pref("devtools.debugger.ui.editor-wrapping", false);
pref("devtools.debugger.ui.framework-grouping-on", true);
pref("devtools.debugger.pending-selected-location", "{}");
pref("devtools.debugger.file-search-case-sensitive", false);
pref("devtools.debugger.file-search-whole-word", false);
pref("devtools.debugger.file-search-regex-match", false);
pref("devtools.debugger.project-directory-root", "");
pref("devtools.debugger.map-scopes-enabled", false);
pref("devtools.debugger.prefs-schema-version", prefsSchemaVersion);
pref("devtools.debugger.log-actions", true);
pref("devtools.debugger.log-event-breakpoints", false);
pref("devtools.debugger.features.workers", true);
pref("devtools.debugger.features.async-stepping", false);
pref("devtools.debugger.features.shortcuts", true);
pref("devtools.debugger.features.root", true);
pref("devtools.debugger.features.map-scopes", true);
pref("devtools.debugger.features.remove-command-bar-options", true);
pref("devtools.debugger.features.code-folding", false);
pref("devtools.debugger.features.command-click", false);
pref("devtools.debugger.features.column-breakpoints", true);
pref("devtools.debugger.features.component-pane", false);
pref("devtools.debugger.features.autocomplete-expressions", false);
pref("devtools.debugger.features.map-expression-bindings", true);
pref("devtools.debugger.features.map-await-expression", true);
pref("devtools.debugger.features.original-blackbox", true);
pref("devtools.debugger.features.log-points", true);
pref("devtools.debugger.features.overlay-step-buttons", true);
pref("devtools.debugger.features.watchpoints", true);
pref("devtools.debugger.features.frame-step", true);
pref("devtools.debugger.features.jump-line", false);
pref("devtools.editor.tabsize", 2);
pref("javascript.enabled", true);

// Assorted preferences accessed elsewhere in the devtools.
pref("devtools.editor.autoclosebrackets", true);
pref("devtools.editor.detectindentation", true);
pref("devtools.editor.expandtab", true);
pref("devtools.editor.keymap", "default");
pref("ui.caretBlinkTime", 530);
pref("devtools.popup.disable_autohide", false);
pref("devtools.styleeditor.enabled", true);

export const prefs = new PrefsHelper("devtools", {
  fission: ["Bool", "browsertoolbox.fission"],
  logging: ["Bool", "debugger.logging"],
  timing: ["Bool", "debugger.timing"],
  editorWrapping: ["Bool", "debugger.ui.editor-wrapping"],
  outlineExpanded: ["Bool", "debugger.outline-expanded"],
  sourcesCollapsed: ["Bool", "debugger.sources-collapsed"],
  clientSourceMapsEnabled: ["Bool", "source-map.client-service.enabled"],
  chromeAndExtensionsEnabled: ["Bool", "chrome.enabled"],
  logExceptions: ["Bool", "debugger.log-exceptions"],
  callStackVisible: ["Bool", "debugger.call-stack-visible"],
  scopesVisible: ["Bool", "debugger.scopes-visible"],
  componentVisible: ["Bool", "debugger.component-visible"],
  workersVisible: ["Bool", "debugger.workers-visible"],
  breakpointsVisible: ["Bool", "debugger.breakpoints-visible"],
  breakpointsVisible: ["Bool", "debugger.logpoints-visible"],
  eventListenersVisible: ["Bool", "debugger.event-listeners-visible"],
  startPanelCollapsed: ["Bool", "debugger.start-panel-collapsed"],
  endPanelCollapsed: ["Bool", "debugger.end-panel-collapsed"],
  startPanelSize: ["Int", "debugger.start-panel-size"],
  endPanelSize: ["Int", "debugger.end-panel-size"],
  frameworkGroupingOn: ["Bool", "debugger.ui.framework-grouping-on"],
  pendingSelectedLocation: ["Json", "debugger.pending-selected-location", {}],
  fileSearchCaseSensitive: ["Bool", "debugger.file-search-case-sensitive"],
  fileSearchWholeWord: ["Bool", "debugger.file-search-whole-word"],
  fileSearchRegexMatch: ["Bool", "debugger.file-search-regex-match"],
  debuggerPrefsSchemaVersion: ["Int", "debugger.prefs-schema-version"],
  logActions: ["Bool", "debugger.log-actions"],
  logEventBreakpoints: ["Bool", "debugger.log-event-breakpoints"],
  indentSize: ["Int", "editor.tabsize"],
});

export const useDebuggerPrefs = prefKey => {
  const fullKey = `devtools.debugger.${prefKey}`;
  const [preference, setPreference] = useState(prefsService.getBoolPref(fullKey));

  useEffect(() => {
    const onUpdate = prefs => {
      setPreference(prefs.getBoolPref(fullKey));
    };

    prefsService.addObserver(fullKey, onUpdate, false);
    return () => prefsService.removeObserver(fullKey, onUpdate);
  }, [fullKey]);

  return {
    value: preference,
    update: newValue => {
      prefsService.setBoolPref(fullKey, newValue);
    },
  };
};

export const javascriptPrefs = new PrefsHelper("javascript", {
  enableJavaScript: ["Bool", "enabled"],
});

// The pref may not be defined. Defaulting to null isn't viable (cursor never blinks).
// Can't use CodeMirror.defaults here because it's loaded later.
// Hardcode the fallback value to that of CodeMirror.defaults.cursorBlinkRate.
prefs.cursorBlinkRate = Services.prefs.getIntPref("ui.caretBlinkTime", 530);

export const features = new PrefsHelper("devtools.debugger.features", {
  asyncStepping: ["Bool", "async-stepping"],
  shortcuts: ["Bool", "shortcuts"],
  root: ["Bool", "root"],
  columnBreakpoints: ["Bool", "column-breakpoints"],
  removeCommandBarOptions: ["Bool", "remove-command-bar-options"],
  workers: ["Bool", "workers"],
  windowlessWorkers: ["Bool", "windowless-workers"],
  codeFolding: ["Bool", "code-folding"],
  autocompleteExpression: ["Bool", "autocomplete-expressions"],
  mapExpressionBindings: ["Bool", "map-expression-bindings"],
  mapAwaitExpression: ["Bool", "map-await-expression"],
  componentPane: ["Bool", "component-pane"],
  originalBlackbox: ["Bool", "original-blackbox"],
  logPoints: ["Bool", "log-points"],
  commandClick: ["Bool", "command-click"],
  showOverlay: ["Bool", "overlay"],
  watchpoints: ["Bool", "watchpoints"],
  windowlessServiceWorkers: ["Bool", "windowless-service-workers"],
  frameStep: ["Bool", "frame-step"],
  jumpLine: ["Bool", "jump-line"],
});

export const asyncStore = asyncStoreHelper("debugger", {
  pendingBreakpoints: ["pending-breakpoints", {}],
  tabsBlackBoxed: ["tabsBlackBoxed", []],
});

export function resetSchemaVersion() {
  prefs.debuggerPrefsSchemaVersion = prefsSchemaVersion;
}

export function verifyPrefSchema() {
  if (prefs.debuggerPrefsSchemaVersion < prefsSchemaVersion) {
    asyncStore.pendingBreakpoints = {};
    prefs.debuggerPrefsSchemaVersion = prefsSchemaVersion;
  }
}

# Current Replay Persistence Logic

## Complaints

- We have a jumbled mixture of methods for defining preferences and persisting them to either `localStorage` or `IndexedDB`
  - Legacy FF prefs system
  - Semi-legacy `asyncStore` mechanism
  - `useLocalStorage`
  - `useFeature`
  - `useStringPref/useBoolPref`
- Legacy FF prefs system requires side-effectful imports
- Lists of preferences currently split across a half-dozen files
- Bunch of legacy FF prefs that are still technically being used, but generally not exposed in the UI
- Tons of dead FF prefs
- Some of our new prefs are now broken (hit counts toggling)
- Annoying multi-step process to define a new "feature" flag:
  - Add `pref("devtools.some.feature")` call
  - Add to `features = new PrefsHelper()`
  - Go update one of the 3 or 4 different "Settings" components to read the flag, add the checkbox (possibly by adding an entry to an `EXPERIMENTAL_SETTINGS` array), and toggle the flag
  - Odd combination of `{...userSettings, ...localSettings`
- Settings are all in browser storage and not in the database
- Why is `enableLargeText` defined in an `ExperimentalUserSettings` type, rather than `LocalExperimentalUserSettings`?

## Open Questions

- Do we reuse any of the FF "prefs service" logic?  
  - The `PrefsHelper` class is kinda nice, especially since it does have TS typing
  - The code in `shared/services.js` "feels" old. but it's there and clearly works
  - It's focused on single values, not per-recording values.  I think that's okay because we've talked about putting all per-recording stuff into IndexedDB
  - Seems silly to continue with the `"devtools."` prefix when it's now "Replay", not "FF DevTools", and no longer part of an entire browser
- How do we want to manage organizing and defining preferences?
  - Currently three major approaches:
    - Legacy-style prefs: defined in "per-feature" groups in various `prefs.js` files scattered around the codebase
    - One-off ad-hoc uses of things like `useLocalStorage` directly in a component
  - Also need to consider the codebase split between `src` and `packages/bvaughn`.  Prefs need to be accessible in the prototype folder
- If we start rewriting prefs names and storage approaches, how do we migrate from old values to new values?
- We've got a bunch of prefs being persisted by watching for the Redux store for state changes after every dispatched action.  That _works_, but isn't efficient (which is part of why we had to debounce writes to `IndexedDB`).  

## Implementations

### `src/devtools/shared/async-storage.ts`:
  
- `IndexedDB`
- Mimics `localStorage` API
- stores everything in DB `"devtools-async-storage"`,  store name `"keyvaluepairs"`
- Used by: `src/devtools/shared/async-store-helper.js`
  
### `src/devtools/shared/async-store-helper.js`

- Wraps around `asyncStorage` with a `Proxy` to allow object field lookups based on a root key combined with the field name
- used by: `src/ui/utils/prefs.ts`

### `src/devtools/shared/services.js`

- Legacy Firefox preferences implementation
- Defines a very complicated set of "preference branch" functionality:
  - Holds `string/int/bool` values
  - Can nest prefs based on dotted field strings like `"devtools.features.xyz"`
  - Tracks whether there is a user-modified value for this pref
  - Allows observing a prefs branch
  - Internally implements the observer pattern,  eventually running through a `_saveAndNotify()` function that saves the value and triggers subscribers
  
### `src/ui/utils/prefs.ts`:
  
- depends on:
  - `PrefsHelper` from `devtools/client/shared/prefs`
  - `pref` from `devtools/shared/services`
  - `asyncStoreHelper` from `devtools/shared/async-store-helper`
- Defines several sets of pref-related data:
  - individual prefs with a `"devtools."` prefix
  - individual prefs with a `"devtools.features."` prefix
  - `PrefsHelper` instances for `prefs` and `features`
  - `asyncStore` instance with a prefix of `"devtools"`
  
### `src/devtools/client/debugger/src/utils/prefs.js`

- Depends on:
  - `PrefsHelper` from `devtools/client/shared/prefs`
  - `pref` from `devtools/shared/services`
  - `asyncStoreHelper` from `devtools/shared/async-store-helper`
- Defines several sets of pref-related data:
  - individual prefs with a `"devtools."` prefix (which all appear to be dead at first glance)
  - individual prefs with a `"devtools.editor"` prefix (also seemingly dead)
  - `PrefsHelper` instance for `prefs`,  also mostly dead
    - actually defines the field `"breakpointsVisible"` twice, pointing to `"debugger.breakpoints-visible"` and `"debugger.logpoints-visible"`
  - `PrefsHelper` instance for `javascriptPrefs`,  dead
  - `PrefsHelper` instance for `features`,  also dead
  - `asyncStore` instance,  no values
  - a `useDebuggerPrefs` hook that listens for changes in those prefs
  - a couple utils for verifying/resetting a prefs schema version
  
### `src/devtools/client/inspector/prefs.js`

- Depends on:
  - `PrefsHelper` from `devtools/client/shared/prefs`
  - `pref` from `devtools/shared/services`
- Defines several sets of prefs-related data:
  - Individual prefs with `"devtools.inspector."` and `"devtools.markup/layout."` prefixes
  - `PrefsHelper` instance for `prefs` with a couple sidebar/tab values
  - `PrefsHelper` instance for `features`,  with one value of `showWhitespaceNodes`
  
### `src/devtools/client/shared/prefs.js`

- Depends on:
  - `Services` from `"devtools/shared/services"`
- Defines:
  - A `PrefsHelper` "class" that:
    - Is an `EventEmitter` and an `Observer`
    - Can convert itself to JSON
    
    
### `packages/bvaughn-architecture-demo/src/hooks/useLocalStorage.ts`

- Depends on:
  - `../utils/storage`: `localStorageGet/SetItem`
- Defines a `useLocalStorage` hook that reads a value,  parses it,  saves it into a `useState`,  and listens for changes via `addEventListener("storage")`


### `src/ui/hooks/settings.ts`

- Depends on:
  - `pref` from `devtools/shared/services`
  - type `ExperimentalUserSettings` from `"../types"`
- Defines:
  - A couple `ExperimentalUserSettings` objects ( `emptySettings` and `testSettings` ) that look identical
  - `getUserSettings()`: fetches user data via GraphQL and then runs it through `convertUserSettings()`
  - `convertUserSettings()`: looks at the GraphQL response,  pulls out several values,  and always sets `enableLargeText` to false
  
### `src/ui/types/index.ts`

- Defines:
  
```ts
export type ExperimentalUserSettings = {
  apiKeys: ApiKey[];
  defaultWorkspaceId: null | string;
  enableTeams: boolean;
  enableLargeText: boolean;
};

export type LocalExperimentalUserSettings = {
  basicProcessingLoadingBar: boolean;
  disableScanDataCache: boolean;
  consoleFilterDrawerDefaultsToOpen: boolean;
  enableQueryCache: boolean;
  enableColumnBreakpoints: boolean;
  enableLargeText: boolean;
  hitCounts: boolean;
  profileWorkerThreads: boolean;
};

export type LocalUserSettings = LocalExperimentalUserSettings & {
  enableDarkMode: boolean;
};

export type CombinedExperimentalUserSettings = ExperimentalUserSettings &
  LocalExperimentalUserSettings;
```
    
## Pref Usages
    
###  `prefs` usages

- `ui/actions/session.ts`: `disableCache`,  `listenForMetrics`
- `ui/components/DevTools.tsx`: `sidePanelSize`
- `ui/components/Redacted.tsx`: `showRedactions`
- `ui/components/SkeletonLoader.tsx`: `sidePanelSize`
- `ui/components/Viewer.tsx`: `secondaryPanelHeight`,  `sidePanelSize`,  `toolboxSize`
- `ui/hooks/settings.ts`: all,  passed as key to `useStringPref` and `useBoolPref`
- `ui/reducers/app`: `theme`
- `ui/reducers/layout`: `defaultMode`
- `ui/setup/helpers`: saved as `window.app.prefs`,  and used in `window.app.dumpPrefs()`
`ui/setup/prefs`: passed to `createPrefsUpdater()`
- `ui/utils/mixpanel`: `logTelemetryEvent`
- `ui/utils/telemetry`: `logTelemetryEvent`


### `features` usages

- `pages/_app`: `repaintEvaluations`
- `ui/actions/session`: `disableScanDataCache`,  `disableQueryCache`,  `profileWorkerThreads`,  `newControllerOnRefresh`,  `logProtocolEvents`,  `logProtocol`
- `ui/actions/timeline.ts`: some kind of string concatenation with `${target}Hover`????
- `ui/components/Comments/CommentReplyButton.tsx`: `commentAttachments`
- `ui/hooks/settings.ts`: all,  passed as key to `useFeature`
- `ui/reducers/protocolMessages`: `logProtocolEvents`
- `ui/setup/helpers`: saved as `window.app.features`,  and used in `window.app.dumpPrefs()`

### `asyncStore` usages

- `ui/setup/helpers`: saved as `window.app.asyncStore`
- `ui/setup/prefs`: read in `getReplaySession()` and `getReplaySessions()`,  written in a debounced updater after Redux actions


### `pref()/Services` usages

- `Services.prefs`:
  - `packages/third-party/css/color.js`: `getCharPref(COLOR_UNIT_PREF)`
  - `src/devtools/client/inspector/layout/components/LayoutApp.tsx`: `getBoolPref(BOXMODEL_OPENED_PREF)`
  - `src/devtools/client/inspector/markup/reducers/markup`: `getBoolPref(ATTR_COLLAPSE_ENABLED_PREF)`,  `getIntPref(ATTR_COLLAPSE_LENGTH_PREF)`
  - `src/devtools/client/inspector/rules/components/RulesApp.tsx`: `getBoolPref(SHOW_PSEUDO_ELEMENTS_PREF)`
  - `src/devtools/client/inspector/rules/models/element-style.ts`: `getBoolPref(PREF_INACTIVE_CSS_ENABLED)`
  - `src/devtools/server/actors/utils/event-breakpoints.ts`: `getBoolPref("dom.input-events.beforeinput.enabled")`
  - `src/ui/hooks/settings.ts`: `useFeature()`,  `useStringPref()`,  `useBoolPref()`
  
- `appinfo.OS`:
  - `packages/third-party/css-logic/shared-inspector-css-logic.js`
  - `src/devtools/client/debugger/src/components/SecondaryPanes/CommandBar.tsx`
  - `src/devtools/client/debugger/src/utils/text.js`
    - Note: this does some keyboard shortcut formatting for Mac vs Win/Linux
  - `src/devtools/client/inspector/markup/components/InspectorSearch.tsx`
  - `src/devtools/client/inspector/rules/models/rule.ts`
  - `src/ui/components/shared/Login/Login.tsx`
  - `src/ui/utils/key-shortcuts.ts`
  
  
### `useFeature` usages

- `src/devtools/client/debugger/src/components/Editor/EditorPane.tsx`: `enableLargeText`
- `src/devtools/client/debugger/src/components/Editor/NewSourceAdapter.tsx`: `showColumnBeakpoints`
- `src/devtools/client/debugger/src/components/PrimaryPanes/index.tsx`: `enableLargeText`
- `src/ui/components/DevTools.tsx`: `enableLargeText`
- `src/ui/components/KeyboardShortcuts.tsx`: `protocolTimeline`
- `src/ui/components/ProtocolTimeline.tsx`: `protocolTimeline`
- `src/ui/components/SecondaryToolbox/NewConsole.tsx`: `consoleFilterDrawerDefaultsToOpen`
- `src/ui/components/SecondaryToolbox/index.tsx`: `chromiumNetMonitorEnabled`
- `src/ui/components/SidePanel.tsx`: `resolveRecording`
- `src/ui/components/Timeline/Capsule.tsx`: `basicProcessingLoadingBar`
- `src/ui/components/Toolbar.tsx`: `logProtocol`
- `src/ui/components/shared/UserSettingsModal/Experimentalsettings.tsx`: `columnBreakpoints`,  `disableScanDataCache`,  `consoleFilterDrawerDefaultsToOpen`,  `profileWorkerThreads`,  `enableQueryCache`,  `basicProcessingLoadingBar`
- `src/ui/components/shared/UserSettingsModal/PreferencesSettings.tsx`: `hitCountsEnabled`,  `enableLargeText`
- `src/ui/components/shared/UserSettingsModal/UserSettingsModal.tsx`: `protocolTimeline`,  `logProtocol`,  `newControllerOnRefresh`


### `useStringPref/useBoolPref` usages

- `useStringPref`:
  - `src/ui/components/shared/UserSettingsModal/PreferencesSettings.tsx`: `defaultMode`,  `hitCounts`
- `useBoolPref`:
  - `src/ui/components/shared/UserSettingsModal/UserSettingsModal.tsx`: `logTelemetryEvent`
  
### `useDebuggerPref` usages

- `src/devtools/client/debugger/src/components/PrimaryPanes/index.tsx`: `"outline-expanded"`
- `src/devtools/client/debugger/src/components/SecondaryPanes/index.tsx`: `"scopes-visible"`,  `"call-stack-visible"`,  `"breakpoints-visible"`,  `"logpoints-visible"`


### `useLocalStorage` usages

- `packages/bvaughn/components/console/ConsoleRoot.tsx`: `"Replay:Console:MenuOpen:${recordingId}"`
- `packages/bvaughn/components/console/hooks/useTerminalHistory.ts`: `"${recordingId}::expressionHistory"`
- `packages/bvaughn/components/sources/SourceList.tsx`: `"Replay:ShowHitCounts"`
- `packages/bvaughn/src/contexts/ConsoleFiltersCOntext.tsx`: `"Replay:Toggles:${recordingId}"`,  `"Replay:showExceptions:${recordingId}"`
- `packages/bvaughn/src/contexts/PointsContext.tsx`: `"${recordingId}::points"`,  `"${recordingId}::points::transition"`

### Other debugger pref usages


- `src/devtools/client/debugger/src/reducers/ui.ts`: `startPanelCollapsed`,  `endPanelCollapsed`,  `sourcesCollapsed`,  `frameworkGroupingOn`
- `src/devtools/client/debugger/src/utils/dbg.js`: constructs `const dbg = {prefs, asyncStore, features, getCM}`, used in `ui/setup/dynamic/devtools` as `window.app.debugger`
- `src/ui/actions/app.ts`: `outlineExpanded`
- `src/devtools/client/debugger/src/utils/log.js`: `logging` (dead file)
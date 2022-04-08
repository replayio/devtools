# Sources Reducer Notes

## Actions Handled

["ADD_SOURCE", "ADD_SOURCES", "INSERT_SOURCE_ACTORS", "REMOVE_SOURCE_ACTORS", "SET_SELECTED_LOCATION", "SET_VIEWPORT", "CLEAR_SELECTED_LOCATION", "SET_PENDING_SELECTED_LOCATION", "LOAD_SOURCE_TEXT", "BLACKBOX", "SET_ORIGINAL_BREAKABLE_LINES", "ADD_BREAKPOINT_POSITIONS", "NAVIGATE", "SET_FOCUSED_SOURCE_ITEM", "SOURCES_LOADED", "BATCH"]

## State

```ts
interface Location {
  url: string;,
  line?: number;
  column?: number;
  // other fields? sourceId?
}

interface SourceActor {
  actor: string;
  id: string;
  introductionType?: unknown;
  introductionUrl?: string;
  source: string;
  sourceMapURL?: string;
  thread: string;
  url: string;
  breakableLines?: unknown | null;
  breakpointPositions?: Map<unknown, unknown>
}

interface Source {
  content: string | null;
  extensionName?: string;
  id: string;
  introductionType?: unknown;
  introductionUrl?: string;
  isBlackBoxed: boolean;
  isExtension: boolean;
  isOriginal: boolean;
  isPrettyPrinted: boolean;
  relativeUrl?: string;
  url?: string;
}

interface SourcesState {
  sources: ResourceCache<UnknownSources>,
  urls: Record<string, SourceId[]>,
  plainUrls: Record<string, string[]>,
  content: Record<unknown, unknown>,
  actors: Record<string, SourceActorId[]>,
  breakpointPositions: Record<SourceId, UnknownBreakpoints>,
  breakableLines: Record<SourceId, number[]>,
  epoch: number,
  selectedLocation: {sourceId: SourceId, ...location} | null,
  pendingSelectedLocation: Location;
  selectedLocationHasScrolled: boolean;
  // DEAD
  chromeAndExtensionsEnabled: boolean;
  focusedItem: unknown;
  sourcesLoading: boolean;

}
```

## Cases

### `"ADD_SOURCE"`

Just `return addSources(state, [action.source])`

- **Dead**: not dispatched anywhere, although it's also referenced in `reducers/tabs.js`

### `"ADD_SOURCES"`

Just `return addSources(state, action.sources);`

Dispatched by: `actions/sources/newSources.js` line 282, which in turn is dispatched in `newGeneratedSources()` on line 253 and `newOriginalSources()` on line 173.

### `"INSERT_SOURCE_ACTORS"`

Just `return insertSourceActors(state, action);`

Dispatched by: `actions/sources/newSources.js` line 254, in `newGeneratedSources()`

### `"REMOVE_SOURCE_ACTORS"`

Just `return removeSourceActors(state, action);`

- **Dead**: dispatched in a `removeSourceActors` thunk, but that is not used anywhere

### `"SET_SELECTED_LOCATION"`

Creates a `location` value, possibly saves it as `prefs.pendingSelectedLocation` (BAD!), updates `state.selectedLocation` and `state.pendingSelectedLocation`.

Dispatched by: `actions/sources/select.js` line 133

### `"SET_VIEWPORT"`

Relies on a check of `gToolbox.currentTool` (ew, globals in a reducer! This should probably be moved into a thunk)

Dispatched by: `components/Editor/index.js` line 112

Note: a couple other functions in the codebase named `updateViewport`, but they're completely different (`server/actors/` folder, related to UI layout)

### `"CLEAR_SELECTED_LOCATION"`

Creates a location object with an empty URL, saves it as `prefs.pendingSelectedLocation` (BAD!), and clears `state.selectedLocation`.

Dispatched by: `actions/sources/select.js`, line 99 in `deselectSource()` and line 107 in `selectLocation()`

### `"SET_PENDING_SELECTED_LOCATION"`

Creates a location object with `{url, line, column}`, saves the pref (BAD!), and sets `state.pendingSelectedLocation`.

Dispatched by: `actions/sources/select.js`, line 75 in `selectSourceURL`

### `"LOAD_SOURCE_TEXT"`

Just `return updateLoadedState(state, action);`

Dispatched by: a `loadSourceTextPromise` function on line 53 in `actions/sources/loadSourceText.js`. This relies on the `redux-promise` middleware. `loadSourceTExtPromise` in turn is dispatched as part of `loadSourceText` on line 68, which is an instance of `memoizableAction`.

### `"BLACKBOX"`

Checks if `action.status === "done"`. If yes, tries to update a "blackboxed list" for that URL (related to prefs and tabs), and then updates a cache entry with `isBlackboxed`.

### `"SET_ORIGINAL_BREAKABLE_LINES"`

Updates `state.breakableLines[sourceId] = breakableLines`

- **Dead** - not referenced anywhere

### `"ADD_BREAKPOINT_POSITIONS"`

Updates `state.breakpointPositions[sourceId]` and merges in new positions.

Dispatched by: `actions/breakpoints/breakpointPositions.js` line 93, inside `_setBreakpointPositions`. This is another instance of `memoizableAction`

### `"NAVIGATE"`

Resets state, but increments `state.epoch`

- **Dead**? Handled by a half-dozen reducers to reset their state, but does not appear to be dispatched anywhere

### `"SET_FOCUSED_SOURCE_ITEM"`

Just sets `state.focusedItem`.

Dispatched by: `components/PrimaryPanes/SourcesTree.js`, line 134 when a sources tree item is focused

### `"SOURCES_LOADED"`

Just sets `state.sourcesLoading = false`.

Dispatched by: `debugger/src/client/index.js` line 44, after waiting for `ThreadFront.findSources()` to complete

### `"BATCH"`

Executes `action.updates.forEach(update => sourcesReducer(state, update)`. Similar code is in several other reducers.

- \*_Dead_: not dispatched anywhere

## Other Functions

### `addSources(state, sources)`

- Makes shallow clones of `state.urls` and `state.plainUrls`
- Updates `state.sources` via `insertResources()`
- For each souce:
  - Updates `state.urls[sourceUrl]` if this source ID isn't there yet
  - Updates `state.plainUrls` if this URL isn't there yet

### `insertSourceActors(state, action)`

- Makes a shallow clone of `state.actors`
- For each source actor:
  - adds `sourceActor.id` to `state.actors[sourceActor.source]` array
- Filters incoming items to just `"scriptElement"` entries. If found, deletes any existing breakpoint entries f rthose sources

### `removeSourceActors(state, action)`

- Constructs sets of actor IDs and source IDs
- For each source, filters out actors by their IDs

### `updateLoadedState(state, action)`

- Checks the `state.epoch` value vs the action, and bails out if they don't match (ie, some other navigation happened in between processing)
  - **Note**: this may be dead?
- Updates a resource entry as either `pending`, `rejected`, or `fulfilled` with the data

### `updateBlackboxFlag(state, sourceId, isBlackboxed)`

- Bails out if that resource doesn't exist
- Updates the existing resource with `isBlackboxed`

### `updateBlackboxList(url, isBlackboxed)`

- Reads `prefs.tabsBlackboxed`

### Selectors

- `getSourcesState(state)`
- `getSourceInSources(source, id)`
- `getSource(state, id)`
- `getSourceFromId(state, id)`
- `getSourceByActorId(state, actorId)`
- `getSourcesByURLInSources(sources, urls, url)`
- `getSourcesByURL(state, url)`
- `getSourceByURL(state, url)`
- `getSpecificSourceByURLInSources(sources, urls, url)`
- `getSpecificSourceByURL(state, url)`
- `getOriginalSourceByURL(state, url)` (alias for `getSpecificSourceByURL`)
- `getGeneratedSourceByURL(state, url)` (alias for `getSpecificSourceByURL`)
- `getGeneratedSource(state, source)` (dummy - just `returns source`)
- `getGeneratedSourceById(state, sourceId)` (alias for `getSourceFromId`)
- `getPendingSelectedLocation(state)`
- `getPrettySource(state, id)`
- `hasPrettySource(state, id)`
- `getSourcesUrlsInSources(state, url)`
- `getHasSiblingOfSameName(state, source)`
- `getSources(state)`
- `getSourcesEpoch(state)`
- `getUrls(state)`
- `getPlainUrls(state)`
- `getSourceList(state)`
- `getDisplayedSourcesList(state)`
- `getExtensionNameBySourceUrl(state, url)`
- `getSourceCount(state)`
- `getSelectedLocation`
- `getSelectedSource`
- `getSelectedSourceWithContent`
- `getSourceWithContent(state, id)`
- `getSourceContent(state, id)`
- `getSelectedSourceId(state)`
- `getHitCountsForSource(state, sourceId)`
- `getHitCountsForSelectedSource(state)`
- `getDisplayedSources`
- `getSourceActorsForSource(state, id)`
- `canLoadSource(state, sourceId)`
- `isSourceWithMap(state, id)`
- `getBreakpointPositions(state)`
- `getBreakpointPositionsForSource(state, sourceId)`
- `hasBreakpointPositions(state, sourceId)`
- `getBreakpointPositionsForLine(state, sourceId, line)`
- `getBreakpointPositionsForLocation(state, location)`
- `getBreakableLines(state, sourceId)`
- `getSelectedBreakableLines`
- `isSourceLoadingOrLoaded(state, sourceId)`
- `selectedLocationHasScrolled(state)`
- `getTextAtLocation(state, id, location)`
- `getSourcesLoading(state)`

## Sources Logic Notes from Jason

- "Source actors": many individual scripts in an HTML file
- One source can have many actors (eval in the console: source, with no URL)
- Server thinks in terms of source actors
- Workers might load the same source many times
- Reloading the page while recording -> more actors
- Currently "mutable" (?), like blackboxing

- "client/server" devtools folder split: FF content process vs privileged process
- In Replay, most of that doesn't apply (highlighting can be done in the client). Can probably delete a lot of the "server" code

- "A lot of this is because a running app could get new sources at any time, whereas we get them all at once"
  - So, possible that the memoization may not be as important
  - Reselect has come a long way
- "Context" and pauses
  - Paused at a point (some line)
  - Redux reads data for that pause point (call stack, etc)
  - Step forward, but that data is still in flight
  - Right now we cancel the thunks themselves
  - What if we just saved it anyway? Would take up memory, but also be around for later

Other thoughts:

- Could add worker support for threads on the backend, we're just sending client events from the main thread atm
- Could simplify the Redux code now, but think about a better way to do it in the future (what about Node? Electron?)

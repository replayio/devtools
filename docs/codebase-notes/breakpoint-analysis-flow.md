# Breakpoint Analysis Handling

## Initiation

Two ways to initiate adding a breakpoint:

### Main Editor

- `components/Editor/index.js`:
  - `mapDispatch`: `actions.addBreakpointAtLine`
  - line 305: calls `addBreakpointAtLine(cx, sourceLine)`
- `actions/breakpoints/breakpoints.ts`:
  - line 44: thunk `addBreakpointAtLine`
    - finds all existing breakpoints for the source file, and tries to find an existing breakpoint for the given line
    - `dispatch(_addBreakpointAtLine(cx, line, logValue, false, true))`

### Hover Icon

`components/Editor/ToggleWidgetButton.tsx`:

- line 103: `dispatch(toggleLogpoint(cx, hoveredLineNumber, breakpoint))`
- `actions/breakpoints/logpoint.ts`:
  - line 30: thunk `toggleLogpoint`:
    - If there is a breakpoint, _and_ it has a `logValue`, remove it
    - Otherwise, `dispatch(addLogpoint(cx, line))`
  - line 42: thunk `addLogpoint`:
    - Find an existing breakpoint for this file for this line
    - If there is one, determine if we should pause
    - `dispatch(_addBreakpointAtLine(cx, line, true, false, shouldPause))`

## Breakpoint Processing

- `actions/breakpoints/breakpoints.ts`:
  - line 258: thunk `_addBreakpointAtLine`:
    - bails out if no selected source
    - constructs breakpoint definition ( `{sourceId, sourceUrl, line, options, logValue}`)
      - Initial `logValue` is based on closest symbol (parsed from AST) + line, if available, or file + line otherwise
    - `dispatch(addBreakpoint(cx, breakpointLocation, options, disabled))`
- `actions/breakpoints/modify.ts`:
  - line 78: thunk `addBreakpoint`:
    - dispatches basic `setRequestedBreakpoint({sourceId, line})` and complex `setBreakpointPositions({ sourceId, line })` ( a `memoizableAction` that reads breakpoint positions and source actors from the store, loads source actor breakpoint columns, groups positions by line, and then inserts breakpoint position )
    - bails out if the user canceled the breakpoint before that process finished (by checking `getRequestedBreakpointLocations` )
    - gathers pieces of the breakpoint ( `{id, disabled, options, location, astLocation, text, originalText}` )
    - `dispatch(setBreakpoint(breakpoint, ThreadFront.recordingId!, cx))` to add the breakpoint entry in the Redux store
    - uses the `client` to either remove an existing breakpoint on the server if this one is disabled, or set the breakpoint
- `client/commands.ts`:
  - line 129: `setBreakpoint`:
    - generates a `logGroupId` if needed
    - adds an internal breakpoint entry based on a generated `locationKey`
    - Checks the breakpoint settings, and will add up to 2 of 4 possible client+server promises:
      - `sourceId && shouldPause`: `ThreadFront.setBreakpoint()`
      - `sourceId && logValue`: `setLogpoint()`
      - `!sourceId && shouldPause`: `ThreadFront.setBreakpointByURL()`
      - `!sourceId && logValue`: `setLogpointByURL()`
    - Awaits those promises and returns results

## Analysis Handling

- `protocol/logpoint.ts`:
  - line 222, `setLogpoint`:
    - Gets source IDs for the given location
    - `setMultiSourceLogpoint(logGroupId, locations, text, condition, showInConsole)`
  - 236, `setMultiSourceLogpoint`:
    - takes `text` (literal text of the logging field), splits the string, and attempts to convert into actual primitives ( `'true'` -> `true` boolean, etc), then maps those into primitive `ValueFront` instances
      - `primitiveValues` will bail out early and return `undefined` if the first substring does not appear to be a valid primitive, which indicates there's no primitives here. otherwise it returns an array of primitives
    - if we have valid primitives:
      - use `getAnalysisPointsForLocation(state, location, condition)` to check `state.app.analysisPoints[key]` for existing analysis points, and if there are any, narrow them down by the focus region if applicable
      - if there are valid points, indirectly insert them into the Redux store by calling `showPrimitiveLogpoints()`, which then calls `LogpointHandlers.onResult()`, which finally loops over to `actions/messages.ts` and calls the handler that was defined in its setup and does `dispatch(onLogpointResult())`
    - Otherwise, if there are no primitives, or no valid analysis points:
      - `await ThreadFront.getBreakpointPositionsCompressed()`
      - Creates a `mapper` string from the logpoint text, which will be used for the eval on the server
      - Creates the `AnalysisParams`: `{sessionId, mapper, effectful: true, locations}`
      - Creates an `AnalysisHandler`, with an `onAnalysisPoints` callback. This will force the client to run an `"Analysis.findAnalysisPoints"` check (the cheaper "up to 10K hits" form). For all new points, the callback:
        - pushes them into a `points` array for more use
        - if there's no `condition`, either calls `showLogpointsLoading()` or `showPimitiveLogpoints()`
      - Determines if we need to "get results": `const shouldGetResults = condition || (showInConsole && !primitives)`
        - If yes, adds an `onAnalysisResult` handler, which will force the client to run an `"Analysis.runAnalysis"` check (the expensive "only up to 200 hits" one). The callback:
          - Adds each result into a `results` array
          - If there's a condition or no primitives, calls `showLogpointsResult`
      - We now have a fully defined `AnalysisHandler` object with its callbacks, and `AnalysisParams` that define the query.
      - Calls `await analysisManager.runAnalysis(params, handler)`. Any incoming data will be processed by the handler callbacks.
      - If there's an error from `analysisManager.runAnalysis()`, calls `saveAnalysisError()`, which in turn dispatches `setAnalysisError() for each location and returns
      - Otherwise, sorts all the returned points by `point.point` fields since they may have arrived out of order
      - Calls `saveLogpointHits()`

## Handling Logpoint Results

- `protocol/logpoint.ts`
  - line 92: `showPrimitiveLogpoints`:
    - Bails out if there's no `LogpointHandlers.onResult` callback, or there's more points than `prefs.maxHitsDisplayed` (default is 500)
    - For each `pointDescription`, calls `LogpointHandlers.onResult()`
      - **Note**: this is a `for..of` loop with an `await` inside, so this is sequential
    - Over in `actions/messages.ts`, this calls `dispatch(onLogpointResult())`
  - line 50: `showLogpointsLoading`:
    - bails out if there's no `LogpointHandlers.onPointLoading` callback, or there's more points than `prefs.maxHitsDisplayed`
    - For each point, calls `LogpointHandlers.onPointLoading()`
      - **Note**: this is a `.forEach()` with an `await` inside, so this is in parallel
    - Over in `actions/messages.ts`, this calls `dispatch(onLogpointLoading())`
  - line 65: `showLogpointsResult`:
    - bails out if there's no `LogpointHandlers.onResult` callback, or there's more points than `prefs.maxHitsDisplayed`
    - For each result:
      - **Note**: this is a `.forEach()` with an `await` inside, so this is in parallel
      - Creates a new `Pause()` instance, and adds `data` to it
      - Creates new `ValueFront` instances for all `values`
      - Calls `LogpointHandlers.onResult()`
        - Over in `actions/messages.ts`, this calls `dispatch(onLogpointResult())`
      - If there are "framework listeners", calls `findFrameworkListeners()`
  - line 110, `saveLogpointHits`:
    - If there's a `condition`, filters down the `points` to only those that correspond to a `result` by key and timestamp
    - For each location, `dispatch(setAnalysisPoints({analysisPoints, location, condition}))`
  - line 474, `findFrameworkListeners`:
    - does some `ValueFront` loading and property checks
    - Sets up another `AnalysisParams` with an `eventLogpointMapper`
      - Per the long comment at `protocol/logpoint.ts` line 390: "Event listener logpoints use a multistage analysis. First, the normal logpoing analysis runs to generate points for the points where regular DOM event listeners are called by the browser. During this first analysis, we look for framework event listeners attached to the nodes that are targeted by the discovered events. In the second phase, we create a new analysis for each point which framework event listeners are associated with. This analysis runs against each call to the framework event listener during the scope of the regular DOM event listener."
    - Sets up another `AnalysisHandler` with `{onAnalysis: showLogpointsLoading, onAnalysisResult: showLogpointsResult}`
    - Runs the analysis: `analysisManager.runAnalysis(params, handler)`

## Running an Analysis

### `AnalysisManager` structure

- Uses `socket.addEventListener` to listen for all `"Analysis.analysisResult/Points/Error"` events, with a separate callback for each
- Each callback looks at the `analysisId` received, retrieves the `AnalysisHandler` instance for that `analysisId`, and calls the appropriate handler function ( `onAnalysisResult/Points/Error`)

### Single Analysis

- `protocol/analysisManager.ts`:
  - line 97, `runAnalysis`:
    - `sendMessage("Analysis.createAnalysis")`
    - For each of the possible params (`locations`, `functionEntryPoints`, `eventHandlerEntryPoints`, `exceptionPoints`, `numRandomPoints`, and `points`), does an `await sendMessage("Analysis.addThatThing", args)` to tell the server to include this info in the analysis run
    - Actually runs the analysis:
      - If `handler.onAnalysisResults` exists, calls `sendMessage("Analysis.runAnalysis")` (the expensive form)
      - If `handler.onAnalysis` exists, calls `sendMessage("Analysis.findAnalysisPoints")` (the cheaper form)
    - Waits for those calls to complete
    - Calls `sendMessage("Analysis.releaseAnalysis")`
    - Calls `handler.onFinished` if it exists

### Batched Analysis

- `protocol/analysisManager.ts`:
  - line 174, `runAnalysisBatches`:
    - Sets up an `AnalysisHandler` that will just fetch all points (via the cheaper request)
    - `await this.runAnalysis(params, pointsHandler)`
    - Slices up `allPoints` into batches of up to 200 points, and for each batch, calls `this.runAnalysis(batchParams, handler)`

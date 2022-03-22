# DevTools Setup Sequence

This is a rough sketch of the execution flow and setup work done to initialize a Redux store in the codebase, particularly when loading the DevTools for viewing a recording.

## General Patterns and Notes

The basic store setup happens once at the Next `_app.tsx` page level. From there, the per-recording page takes the store and passes it to a DevTools-specific bootstrapping function

That DevTools bootstrap function in turn passes the store down to a dozen other similar per-feature bootstrap functions, most of which end up hooking up event handlers to call `store.dispatch()` directly. This is not an _ideal_ pattern, but [it is a valid technique that is semi-suggested in the Redux docs](https://redux.js.org/faq/code-structure#how-can-i-use-the-redux-store-in-non-component-files).

The main issue is that there's dozens of files involved, and so it's very hard to know what the actual execution sequence is and what code may have dependencies on certain variables existing.

There's also some setting of global variables, like `window.gToolbox` for manipulating the "DevTools Toolbox" UI (?), and `window.app` which contains the `store` and a bunch of pre-bound action creators and selectors.

## All Pages

- `pages/_app.tsx`: main Next app component for every page
  - has `const [store, setStore] = useState<Store | null>()`
  - `import { bootstrapApp } from "ui/setup";`
  - `bootstrapApp().then(setStore)` in a `useEffect` to create the initial Redux store
- `ui/setup/index.ts::bootstrapApp()`:
  - `import { bootstrapStore } from "./store";`
  - Assumes only `{app, layout, tabs}` as initial state + reducers
  - Awaits `getInitialLayoutState/getInitialTabsState`
    - These in turn `await asyncStore.replaySessions`
      - `asyncStore` is defined in `"ui/utils/prefs"`, and is an instance of `asyncStoreHelper` from `"devtools/shared/async-store-helper"` - a `Proxy` wrapper for `asyncStorage`
  - `const store = bootstrapStore(initialState)` to actually create the initial store
    - calls RTK's `configureStore()` with initial `{app, layout, tabs}` reducers, sets up telemetry middleware and Redux DevTools
  - sets up telemetry
  - registers "store observers"
    - `ui/setup/prefs`: creates a store subscriber that persists various pref values to local/async storage
  - sets up "app helper"
    - `window.app = {store, prefs, features, triggerEvent, sendMessage, ....}`
  - Renders React-Redux `<Provider store={store}>`

## Recording / DevTools UI

- `pages/recording[id].tsx`: Next page for showing a specific recording by ID
  - `import setup from "ui/setup/dynamic/devtools";`
  - Reads `const store = useStore()`
  - `await setup(store)` in a `useEffect` to add additional reducers and behavior to the Redux store
- `ui/setup/dynamic/devtools.ts`: Bootstrap logic for most of the rest of the Redux store setup
  - `export default async function DevTools(store: AppStore)`: same as `setup(store)` in `recording/[id].tsx`
  - creates `window.gToolbox = new DevToolsToolbox()`
  - fills in `window.app.{threadFront, actions, selectors, console, debugger}`, to make several key pieces of functionality globally available
  - `await dbClient.loadInitialState()` and `await asyncStore.commandHistory` to help set up initial state for new reducers based on prefs/etc, as well as console/messages state
  - sets up reducers:
    - `app, comments, contextMenus, network, reactDevTools, timeline`
    - Debugger (`devtools/client/debugger/src/reducers/index.js`:
      - `sourceActors, sources, breakpoints, pendingBreakpoints, asyncRequests, pause, ui, fileSearch, ast, quickOpen, sourceTree, threads, eventListenerBreakpoints, preview`
    - Web console ( `devtools/client/webconsole/reducers/index.js`):
      - `filters, messages, consoleUI`
  - Bootstraps workers: `parser` and `search`
  - `import { clientCommands } from "devtools/client/debugger/src/client/commands";`, and sets up `{ client: clientCommands }` as thunk extra args
  - Extends store with new slice reducers and thunk args
  - `dbgClient.bootstrap(store)`
    - `devtools/client/debugger/src/client/index.js`
    - Triggers loading of sources via `ThreadFront.findSources()`
    - Initializes some command data structures
    - Hooks up some `ThreadFront` events to bound Redux action creators for `paused,resumed, newQueuedSources`
    - Subscribes to the store to update more prefs for `pendingBreakpoints`
  - Creates websocket to talk to the server
    - Socket setup: `protocol/socket.ts`

### Additional DevTools Bootstrapping

`DevTools()` calls these additional bootstrapping functions at the end:

- `ui/actions/app.ts::setupApp(store)`:
  - Auth token setup
  - Waits for thread session, sets session ID, loads various kinds of events (keyboard, nav, etc)
  - Calls `ThreadFront.ensureProcessed()` for "basic" and "executionIndexed", sets loading actions
  - Listens for loading region changes and dispatches
- `ui/actions/timeline.ts::setupTimeline(store)`:
  - Dispatches on pause
  - Sets up keyboard shortcuts to jump to next/prev paint and toggle playback
- `devtools/client/debugger/src/actions/event-listeners.js::setupEventListeners())`
  - Loads event listener breakpoint types
  - Waits for `client.setEventListenerBreakpoints()`
- `protocol/graphics.ts::setupGraphics(store)`:
  - Defines `onRefreshGraphics` callback, which does a bunch of canvas painting and video playback work
  - Sets up `ThreadFront` "paused" handler, which paints graphics and tries to precache screenshots
- `devtools/client/webconsole/utils/syntax-highlighted.js::initOutputSyntaxHighlighting()`:
  - Sets up CodeMirror syntax highlighting in a `CustomElement`
- `devtools/client/webconsole/actions/messages.js::setupMessages(store)`:
  - Sets up `LogpointHandlers` event callbacks that dispatch when logpoint events happen
  - Calls `ThreadFront.findConsoleMessages()`, then dispatches `"MESSAGES_LOADED"`
- `devtools/client/webconsole/actions/network.ts::setupNetwork(store)`:
  - Calls `ThreadFront.findNetworkRequests()` and dispatches results
- `protocol/logpoint.ts::setupLogpoints(store)`:
  - Calls `analysisManager.init()`, saves `store` ref
- `devtools/client/debugger/src/actions/logExceptions.js::setupExceptions()`:
  - Just sets `clientCommands.logExceptions(true)` based on store state
- `ui/actions/reactDevTools.ts::setupReactDevTools(store)`:
  - Calls `ThreadFront.getAnnotations()` and dispatches results

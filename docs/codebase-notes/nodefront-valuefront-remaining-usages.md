## `NodeFront` uses

- `devtools/client/framework/selection.ts`:
  - tracks a single `NodeFront` instance for the current selected DOM node
- `devtools/client/inspector/breadcrumbs.js`:
  - iterates over ancestors of the selected node to print the breadcrumbs and update that as needed
- `devtools/client/inspector/boxmodel/actions/box-model.ts`:
  - listens to the current selected node to ask it for its bounding rect and computed style
- `devtools/client/inspector/event-listeners/EventListenersApp.tsx`:
  - asks the selected node for its event listeners and framework event listeners
- `devtools/client/inspector/event-listeners/XHTMLNode.tsx`:
  - takes a `NodeFront` as a prop and reads fields like `id`,  `displayName`,  and `classList`
- `devtools/client/inspector/markup/actions/markup.ts`:
  - listens for `"PAUSED"`,  resets the DOM node data from the Redux state,  asks for `ThreadFront.getRootDOMNode()`,  and also finds the `<body>` node to expand it via `rootNode.querySelector()`
  - listens to the current selected node,  and runs a bunch of async update logic:
    - dispatches `nodeSelected(selectedNode.objectId())`
    - loops up the ancestor chain to trigger expansion of all ancestors
  - Triggers selection by taking a `nodeId`,  calling `const nodeFront = ThreadFront.currentPause?.getNodeFront(nodeId)`,  and setting that as selected
  - a bunch of thunks for doing next/prev/up/down/whatever,  although those seem mostly based on node IDs and appear to refer to `state.markup.tree.entities[nodeId]` (ie,  the POJO data converted from the `NodeFront` objects)
- `devtools/client/inspector/rules/actions/rules.ts`:
  - listens to the current selected node to ask it for its styles and computed properties
- `devtools/client/inspector/rules/models/class-list.ts`:
  - Tracks a `Map<NodeFront,  ClassInfo[]>` to store classnames from the node
- `devtools/client/inspector/rules/models/element-style.ts`:
  - stores a reference to the current `NodeFront`
  - `async populate()`: gets all applied rules and inline styles for the node,  also works its way up through parents to get their rules and styles
  - works with `Rule` and `TextProperty` instances
- `devtools/client/inspector/rules/models/rule.ts`:
  - Stores an `ElementStyle` and `RuleFront/StyleFront` references
  - Stores `inherited: NodeFront | null` to get details on a rule that was inherited from a parent node,  like its display name
- `devtools/client/webconsole/actions/toolbox.ts`:
  - calls `grip.getNodeFront()` to highlight it,  as well as `pause.ensureDOMFrontAndParents()` to ensure data is loaded before selecting a node in the "Elements" panel
- `devtools/server/actors/highlighters/auto-refresh.ts`:
  - stores the current node so its child classes (only `BoxModelHighlighter`) can read layout properties and position the highlight overlay
- `devtools/server/actors/highlighters/box-model.ts`:
  - reads `this.currentNode` to determine if it can show the overlay,  and also read the coords of the current DOM node to position it
- `devtools/server/actor/highlighters/utils/markup.ts`:
  - one `isNodeValid` util function
- `devtools/shared/layout/utils.ts`:
  - util functions that read node coords,  or check what kind of node it is
- `highlighter/highlighter.ts`:
  - Stores the current node,  calls `node.getBoxModel()`,  and `this.boxModelHighlighter.show(node)`
- `ui/actions/event-listeners.ts`:
  - `async getFrameworkEventListeners()`: takes a `NodeFront` and calls methods like `node.getObjectFront().loadProperties()` to fetch data
- `ui/components/NodePicker.tsx`:
  - apparently has a couple methods used in E2E test harness logic to select a node
- `ui/components/SecondaryToolbox/ReactDevTools.tsx`:
  - handles a `"highlightNativeElement"`event case by calling `ThreadFront.evaluate()` and then `response.returned.getNodeFront()` so it can highlight that node
  
  
## `ValueFront` / `ValueItem` uses

- `devtools/client/debugger/src/actions/preview.ts`:
  - `evaluate()`: calls `ThreadFront.evaluate()`,  and if there's an error,  `createPrimitiveValueFront("Evaluation failed")`
  - `setPreview()`: similar,  but `createPrimitiveValueFront(undefined)`,  as well as `root = new ValueItem(); root.loadChildren(); root.recreate()`
- `devtools/client/debugger/src/reducers/pause.ts`:
  - doesn't create `ValueFront`s directly,  but the frame/scope data can contain them (including `Frame.this`)
- `devtools/client/debugger/src/utils/expressions.js`:
  - calls `createUnavailableValueFront()`
- `devtools/client/debugger/src/utils/pause/scopes/utils.ts`:
  - Creates `new ValueItem()` instances for things like exceptions and return values
- `devtools/client/webconsole/actions/input.ts`:
  - `evaluateExpressions()`: calls `createPrimitiveValueFront` while loading data or on evaluation completed
- `devtools/client/webconsole/actions/toolbox.ts`:
  - `openNodeInInspector()`: takes a `ValueFront` as an arg
- `devtools/client/webconsole/components/Input/EagerEvalFooter.tsx`:
  - stores a `ValueFront` in state,  which comes back from `await eagerEvaluateExpression()`
- bunch of other legacy `webconsole` and `devtools-reps` files
- `devtools/client/inspector/event-listeners/EventListenersApp.tsx`:
  - gets function name/param names from `ValueFront`s
- `ui/actions/logpoint.ts`:
  - Legacy `LogpointHandlers` callback holder has `onResult` callback with `ValueFront[]`
  - `showLogpointsResult()` takes incoming `values`,  and maps over them to create `ValueFront`s
  - `showPrimitiveLogpoints()` takes a `ValueFront[]` and passes them to `LogpointHandlers.onResult()`
  - `setMultiSourceLogpoint()` calls `createPrimitiveValueFront()`
- `ui/utils/autocomplete`:
  - Several types have `ValueFront` fields,  although I think these represent data coming from somewhere else
  
  
## `packages/protocol` Logic

### `pause.ts`

- All the `Wired*` types have `ValueFront`s inside
- `Pause` stores `documentNode: NodeFront`
- `_updateDataFronts()`: 
  - for every `Frame`,  fills in `frame.this = new ValueFront()`
  - for every `Scope`,  fills in `ValueFront`s for all bindings,  and `scope.object`
  - For every `object`,  fills in `ValueFront`s for:
    - for all properties,  `property.value/get/set`
    - for all `key/value` pairs in `containerEntries`
    - for all `state/value` fields in promises
    - for all `target/handler` fields in proxies
    - for all `value` fields in getters
    - for all `prototypeValue` fields in previews
- most other methods return objects with `ValueFront`s inside,  or create new ones:
  - `getScopes()`
  - `getObjectPreview()`
  - `getObjectProperty()`
  - `get*Front()`
  - `ensureDOMFrontAndParents()`
  - `loadDocument()`
  - `searchDOM()`
  - `loadMouseTargets()`
  - `getMouseTarget()`


## `node.ts`

- `this._pause` usage,  most of which are wrappers around `client.DOM.getSomething()`
  - `getObjectFront()`
  - `parentNode()`
  - `childNodes()`
  - `querySelector()`
  - `getComputedStyle()`
  - `getEventListeners()`
  - `getAppliedRules()`
  - `getBoxModel()`
  - `getBoundingClientRect()`
- method usages:
  - `objectId()`:
    - `actions/markup.ts`,  `rules/models/rule.ts`
  - `getObjectFront()`:
    - `actions/event-listeners.ts`
  - `isNodeBoundsFront()`:
    - `highlighters/box-model.ts`,  `utils/markup.ts`
  - `isConnected()`:
    - `framework/selection.ts`,  `utils/markup.ts`
  - `parentNode()`:
    - `inspector/breadcrumbs.js`,  `actions/markup.ts`,  `rules/models/element-style.ts`
  - `childNodes(),  getNodeValue,  querySelector(),  isDisplayed(),  getDisplayType(),  hasEventListeners()`:
    - `actions/markup.ts`
  - `getComputedStyle()`:
    - `actions/box-model.ts`,  `computed/actions/index.ts`
  - `getEventListeners()`:
    - `inspector/event-listeners/EventListenersApp.tsx`
  - `getAppliedRules(),  getInlineStyle()`:
    - `rules/models/element-style.ts`
  - `getBoxModel()`:
    - `highlighter/highlighter.ts`
  - `getBoxQuads()`:
    - `shared/layout/utils.ts`
  - `getBoundingClientRect()`:
    - `actions/box-model.ts`,  `test/harness.ts`

## `value.ts`

- `this._pause` usage:
  - `getExecutionPoint()`
  - `getPause()`
  - `id()`
  - `getNodeFront()`
  - `getProperty()`
- generally,  _lots_ of lookups from `this._object.preview`
- several accesses of `this._object.preview.node`,  which is a `NodeFront` mutated in later
- method usages:
  - `getExecutionPoint()`:
    - `webconsole/reducers/messages.ts`
  - `getPause()`:
    - self,  `webconsole/actions/toolbox.ts`,  several `devtools-reps` files
  - `id()`:
    - `inspector/event-listeners/EventListenersApp.tsx`,  `reducers/messages.ts`,  `webconsole/utils/connected-object-inspector.tsx`
  - `isObject()`:
    - `reducers/messages.ts`,  `devtools-reps/whatever`,  `actions/event-listeners.ts`,  `actions/logpoint.ts`,  `SecondaryToolbox/ReactDevTools.tsx`
  - `getObject()`:
    - `webconsole/utils/autocomplete-eager.ts`, `ui/utils/autocomplete.ts`
  - `objectId()`:
    - `devtools-reps`,  `SecondaryToolbox/ReactDevTools.tsx`
  - `hasPreview()`:
    - self,  `EventListenersApp.tsx`
  - `hasPreviewOverflow()`:
    - self,  `devtools-reps`
  - `previewValueMap()`:
    - self,  `devtools-reps`,  `ui/actions/event-listeners.ts`,  `actions/find-tests.ts`,  `actions/logpoint.ts`
  - `previewValueCount(),  regexpString,  dateTime`: 
    - **dead**
  - `previewGetters()`:
    - `devtools-reps`
  - `previewContainerEntries()`:
    - `devtools-reps`,  `ReactDevTools.tsx`
  - `previewPromiseState(),  previewProxyState(),  previewPrototypeValue(),  isBigInt(),  isSymbol(),  isUnserializableNumber(),  isNode(),  isNodeBoundsFront(),  nodeType(),  nodeName(),  isNodeConnected(),  nodeAttributeMap(),  nodePseudoType(),  documentURL(),  isScope(),  hasChildren()`:
    - `devtools-reps`
  - `className()`:
    - `debugger/src/utils/pause/scopes/getScope.ts`,  `reducers/messages.ts`,  `devtools-reps`,  `actions/event-listeners.ts`,  `actions/logpoint.ts`
  - `functionName(),  unctionParameterNames()`:
    - `EventListenersApp.tsx`
  - `mappedFunctionLocation()`:
    - `EventListenersApp.tsx`,  `devtools-reps`
  - `functionLocationFromLogpoint()`:
    - `actions/logpoint.ts`
  - `isString()`:
    - `actions/find-tests.ts`
  - `isPrimitive(),  primitive()`:
    - self,  `EagerEvalFooter.tsx`,  `useConsoleSearch.tsx`,  `reducers/messages.ts`,  `devtools-reps`,  `ReactDevTools.tsx`
  - `isUninitialized(), getProperty()`:
    - `devtools-reps`
  - `isUnavailable()`:
    - `pause.ts`,  `devtools-reps`
  - `getNodeFront()`:
    - `ReactDevTools.tsx`
  - `load()`:
    - self,  `ObjectInspector.tsx`
  - `loadIfNecessary()`:
    - `autocomplete-eager.ts`,  `devtools-reps`,  `NewConsole.tsx`,  `ui/utils/autocomplete.ts`
  - `loadProperties()`:
    - `actions/event-listeners.ts`,  `actions/logpoint.ts`
  - `traversePrototypeChain()`:
    - `devtools-reps`
  - `traversePrototypeChainAsync()`:
    - `devtools-reps`,  `autocomplete-eager.ts`
  - `getJSON()`:
    - `ReactDevTools.tsx`
  - standalone: `createPrimitiveValueFront()`:
    - `debugger/src/actions/preview.ts`,  `webconsole/actions/input.ts`,  `webconsole/.../PageError.js`,  `devtools-reps`,  `actions/logpoint.ts`
  - standalone: `createUnavailableValueFront()`:
    - **dead**
    
## Summarizing `NodeFront/ValueFront` Usage Locations

- "Elements" tab
  - Current selected DOM node
  - DOM nodes ("Markup" tab data fetching)
  - CSS rules ("Rules/Computed" tabs data fetching)
  - Event listeners ("Event Listeners" tab)
  - Breadcrumbs "component"
- Console
  - Logpoints
  - Autocompletion
- Scopes/Frames
- Highlighting
    
## Thoughts

- Kill the old console first. That lets us remove a ton of usages of all the front types and methods
- See if we can rework Autocomplete, Event Listeners, Highlighters, Scopes, Breadcrumbs, and Logpoints logic to not rely on these. At that point,  we're basically down to just "Markup"/"Rules"/"Computed"
- We'll need to continue to pre-fetch scopes data every time we pause. Currently,  that's done via `ThreadFront.on("paused")` in `actions/paused.ts`,  which dispatches several thunks ( `fetchAsyncFrames(),  setFramePositions(),  fetchScopes()` ). The scopes data in particular can include values that are needed by rules logic later,  such as stylesheet objects.
- The data fetching methods in `NodeFront` and `ValueFront` ultimately are wrappers around protocol API methods like `client.CSS.getAppliedRules()` and `client.DOM.querySelector()`.
- We've got async logic that traverses parent DOM node chains.  That has to be reworked.
- Logic for tracking selection can mostly be changed to be Redux-centric - we're already tracking a selected item ID in the store
- CSS rule parsing logic is also really tricky.
- Question: _do_ we need to unify the object cache stuff for the elements panel with the object cache for the console? We're definitely likely to want to display some of the same items (like a DOM node in the "Markup" tree vs logging out that node into the console,  or something),  and conceptually it would be nice to have all that data in one place and not duplicated
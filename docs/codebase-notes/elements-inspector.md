# Replay Elements Panel Codebase

## Overview

Generally lives in `devtools/client/inspector/`
  - subfolders for the various concepts / sub-tabs (`boxmodel`, `changes`, `computed`, `layout`, `markup`, `rules`, `event-listeners`). Each of those in turn mostly have their own `actions/reducers/components/selectors` subfolders
  - additional folders for shared code: `actions`, `reducers`, `state`, `shared`
  - 

### Entry Points

#### `<InspectorApp>` component
  
- Lives in `./components/App.tsx`
- Imported in 5 locations, all dynamic imports:
  - `inspector/actions/markup.ts`:  `selectNode()` (use of `window.gInspector` global)
  - `webconsole/actions/toolbox.ts`: `highlightDomElement()`, `unHighlightDomElement()`, `openNodeInInspector()` (use of `window.gInspector` global)
  - `ui/components/SecondaryToolbox/index.ts`: wrapped in `React.lazy()` for actual rendering
- Imports several other "$FEATUREApp" components, one per tab in the UI (`ComputedApp`, `LayoutApp`, `MarkupApp`, RulesApp`, EventListenersApp`
- Also imports the root `Inspector` class, instantiates it, and assigns `window.gInspector = new Inspector()`
  - This is a global variable that a few other files rely on to trigger some global behavior like "show this DOM node" programmatically
- Stores `state.inspector.activeTab` value in Redux and renders the appropriate tab with props
  - Props come from the global `window.inspector` class instance, like `<RulesApp 
{...inspector.rules.getRulesProps()} />`
- Rest of the component is just rendering a `<SplitBox>` with a `<ResponsiveTabs>`
  - Renders a `<MarkupView>` (the actual "Elements" section) plus one sidebar tab

#### `class Inspector`

- Lives in `./inspector.ts`
- Plain TS class that is decorated as an `EventEmitter`
- Setup:
  - creates several child class instances: `MarkupView`, `RulesView`, `BoxModel`, `Selection`
  - Stores references to `window`, `window.document`, `window.app.store`, and a singleton `Highlighter` class instance
- Has getters for `Highlighter`, a `HighlightersOverlay`, and `CSSProperties`
- `getCommonComponentProps()`: returns `{setSelectedNode, onShowBoxModelHighlighterForNode}` (although `onSBMHFN` is empty and does nothing)
  
  
  
## "Elements" Markup Panel

### Entry Point - `<MarkupApp>`

- Lives in `client/inspector/markup/components/MarkupApp.tsx`
- Reads `state.markup` from Redux: `markupRootNode: state.markup.tree[state.markup.rootNode!]`
- Renders `<Nodes>` component for the actual elements tree, plus a `<LoadingProgressBar>` if no tree nodes are available
- Also renders plain DOM elements that act as uncontrolled vanilla JS inputs, with logic elsewhere:
  - search box
  - "Add Node" and "Eyedropper toggle" buttons (both invisible and obsolete?)
  - HTML breadcrumbs container
- Instantiates a `MarkupSearchbox` and `HTMLBreadCrumbs`, with `inspector` as a constructor arg. These are vanilla JS logic for those parts of the UI
  
### Search Box

- Parent lives in `markup/searchbox.ts`:
  - Depends on `Inspector` instance, passed in as an arg
  - `this.search` creates an `InspectorSearch` singleton
  - `this.setupSearchBox()` finds some elements with `doc.gEBId`, listens for `"focus"` on `"#inspector-searchbox"`, and in turn listens for `"search-cleared/search-result"` events from `this.search`. Also adds a `CTRL+F` keyboard shortcut scoped to the markup panel
  - Side note: there's no "Next/Previous" buttons with the search box here?
- Input handling and query logic lives in `inspector-search.js`:
  - listens for `"keydown"` and `"input"` events, makes itself an `EventEmitter`, stores the last query as a promise that tests can wait for (but that appears to be unused)
  - Calls `ThreadFront.searchDOM()`, waits for results
  - Accesses `this.inspector.selection.nodeFront` to check for a node index, and calls `this.inspector.selection.setNodeFront(node, {reason: "inspectorsearch"})`
  
### HTML Breadcrumbs

- Location: `./breadcrumbs.js`
- Setup:
  - Creates an `ArrowScrollBox()` instance attached to its outer element
  - Sets up click/mouse/focus event listeners
  - Adds keyboard shortcuts (but that code is dead)
  - Saves `this.selection = this.inspector.selection` (the one `Selection` instance)
  - Binds its methods, and sets up several listeners for `this.selection.on` events: `"new-node-front"`, `"pseudoclass"`, `"attribute-changed"`, `"markupmutation"`
- Core logic is in `update()` method at the end
  - Checks to see if `mutations` arg is "interesting" and justifies actually updating
  - Lots of manual "figure out what we should change in this display" logic (ew!)
  - Generally reads things from `this.selection`:
    - Method calls like `this.selection.isElementNode()`
    - Several uses of `this.selection.nodeFront`
  - Triggers `this.inspector.emit("breadcrumbs-updated")`
- Node buttons:
  - Hovering calls `this.inspector.highlighter.highlight(node)`
  - Clicking calls `this.selection.setNodeFront(node)`
  
### Selection Tracking - `class Selection`

- Location: `devtools/client/framework/selection.ts` (up and over a folder from the rest of the inspector code)
- Per docs: "Singleton belonging to the Toolbox that manages the current selected `NodeFront`, and provides helpers about the context of the selected node"
- Fields:
  - `this._isSlotted`: per comment, a node can be shown twice if part of a Shadow DOM slot
  - `this.reason`: a "reason" for the latest change. saved and then passed as an arg when it emits `"new-node-front"`, but I don't think this is referenced anywhere else
- Methods:
  - `setNodeFront(nodeFront, {reason, isSlotted})`: saves a `NodeFront` reference and calls `this.emit("new-node-front")` indicating selection has changed
- Getters: lots of helpers for things like `isElementNode`, `isAttributeNode`, `isAnonymousNode`, `isShadowRootNode`, etc
    
### Markup State - `class MarkupView`

This is effectively state management logic.  It tries to tie together the "current selected `NodeFront` value" with the Redux store, dispatches actions when there's a pause or resume, and handles node expand/collapse/select from clicks, 

- Location: `./markup/markup.ts`
- Setup:
  - Saves references to `inspector`, `inspector.selection`, `inspector.store` (so it does have access to Redux)
  - Fields for `isInspectorVisible`, `isLoadingPostponed`, `hoveredNodeId`
  - Imports `ThreadFront` and adds listeners for `"paused"` and `"resumed"`
  - Listens to `"new-node-front"` changes from `selection`
  - Subscribes to the Redux store with `this.updateIsInspectorVisible`
- Methods:
  - `updateIsInspectorVisible()`: reads Redux state to see if the Inspector is selected, updates the boolean, and calls `this.loadNewDocument()` if needed
  - `getMarkupProps()`: returns props for the `<Nodes>` component: `{onSelectNode, onToggleNodeExpanded, onMouseEnter/LeaveNode}`.  The props are the actual class methods
  - `onPaused()`: Dispatches the `reset()` action, which also resets the `rootNodeWaiter` promise in `actions/markup.ts`, and either loads a new document now or waits until the "Elements" tab is selected and made visible
  - `onResumed()`: calls `selection.setNodeFront(null)` and dispatches `reset()`
  - `loadNewDocument()`: 
    - Ensures sources are loaded
    - Gets current `pause`
    - Clears selected node front if necessary
    - `dispatch(newRoot()`
    - Either `dispatch(selectionChanged()` , or waits for `ThreadFront.getRootDOMNode()` and then potentially sets it as selected
  - `expandNode/collapseNode()`: dispatches Redux actions for a node ID
  - `onSelectNode()`: looks up a `NodeFront` by ID from `ThreadFront` and passes that to `selection.setNodeFront()`
  - `onMouseEnter/LeaveNode()`: Highlights or unhilights a node using the `Highlighter` class
  - `update()`: if the inspector is visible, dispatches `selectionChanged()`
  
### Elements Display Components
  
#### `<Nodes>`

- Location: `./markup/components/Nodes.tsx`
- Props:
  - Pulls type `MarkupProps` from `MarkupApp.tsx`: `{onSelectNode, onToggleNodeExpanded, onMouseEnter/LeaveNode}`
  - Gets the entire root `NodeInfo` data from Redux
  - Binds actions for up/down/left/right/pageDown/pageUp keys
- Adds keyboard shortcuts for those keyboard actions
- Renders the node tree root items with an outer ARIA `role="tree"` and `<Node nodeId={nodeId}`


#### `<Node>`

- Location: `./markup/components/Node.tsx`
- Props:
  - `mapState`: `{node, rootNodeId, isSelectedNode, isScrollIntoViewNode}`
  - `mapDispatch`: `{setActiveTab}`
  - Parent: `{nodeId}` + `MarkupProps` interaction methods from above
- Renders: 
  - line item + expander
  - "component" (`ElementNode/TextNode/ReadOnlyNode`)
  - "events badge" (indicating if there's event listeners attached)
  - child nodes / loading spinner (based on `node.isLoadingChildren`), 
  
#### Node Types

- `<ElementNode>`:
  - Renders open/close tags, attributes (sorted with `id/class` first), expander, inline text, `display` badge (flex/grid/etc) with tooltip explaining layout behavior, "scrollable" badge
- `<NodeAttributes>`:
  - Renders attribute as a span, with `name=value`, max length, link parsing
- `<ReadOnlyNode>`:
  - Just formats `displayName/isDocType/pseudoType`
- `<TextNode>`:
  - Formats text or comments, replaces whitespace if needed
  
### Elements Redux Logic

#### `./markup/actions/markup.ts`
  
- Plain Redux action creators for `updateNodeExpanded`, `updateSelectedNode`, `updateChildrenLoading`, `updateScrollIntoViewNode`, `newRoot`, `addChildren`
- Has a `rootNodeWaiter` deferred
- Selectors for checking node relations: `getLast/Previous/NextNodeId`
- Thunks for keyboard interactions: `Up/Dwn/Left/Right/PageUp/PageDown` that look up node IDs and dispatch `selectNode()`
- Thunks for additional operations:
    - `selectNode`:
      - Reads `const nodeFront = ThreadFront.currentPause?.getNodeFront(nodeId);` 
      - Calls `Highlighter.highlight(nodeFront)`
      - Calls `window.gInspector.selection.setNodeFront(nodeFront)`
    - `expandNode`:
      - Dispatches `updateNodeExpanded(nodeId, true)`
      - Dispatches to mark all children as loading, and possibly scroll into view
      - `const childNodes = await nodeFront.childNodes()`
      - `dispatch(addChildren())`
      - `dispatch(updateChildrenLoading())`
    - `selectionChanged`:
      - `dispatch(updateSelectedNode())`
      - Uses `NodeFront`s to recurse up the parents and `dispatch(expandNode(ancestor.objectId()))`
- `convertNode(node: NodeFront): Promise<NodeInfo>`:
  - converts a `NodeFront` class instance into a simpler `NodeInfo` POJO
  
#### `./markup/reducers/markup.ts`

- Legacy-style Redux reducers, albeit written as a lookup table and a homegrown `createReducer` function rather than a `switch/case`
- Primarily stores a normalized tree of `NodeInfo` objects keyed by node ID, as well as ID strings for the root node / currently selected node / node to scroll into view, and prefs for collapsing attributes
- Handles cases:
  - `"RESET"`: resets to initial state
  - `"NEW_ROOT"`: stores the root node
  - `"ADD_CHILDREN"`: updates a node entry with its child IDs, and adds the child nodes to the table
  - `"UPDATE_NODE_EXPANDED"`: updates a node's `isExpanded` field
  - `"UPDATE_CHILDREN_LOADED"`: updates a node's `isLoadingChildren` field
  - `"UPDATE_SELECTED_NODE/UPDATE_SCROLL_INTO_VIEW_NODE"`: sets the matching node ID field
  
### Other Logic and Files

- `constants.js`: a single array of HTML elements with no closing tag
- `types.js`: `PropTypes` definitions for markup and DOM node components
- `utils.js`: vanilla JS/DOM methods for flashing elements, autocomplete max width, checking `display` types, and parsing attribute values



## "Rules" Sub-Panel

### Entry Point

- Location: `./rules/components/RulesApp.tsx`
- Props:
  - `rules: RuleState[]`
  - Callbacks: `{onToggleDeclaration, onToggleDeclarationHighlighter, showContextMenu, showDeclarationNameEditor,showDeclarationValueEditor, showNewDeclarationEditor, showSelectorEditor}`
- Redux:
  - Reads `state.rules.rules` (**NOTE: THIS IS RETURNING A USELESS WRAPPER AND SHOULD BE FIXED!**)
- State:
  - A `rulesQuery` string
- Renders:
  - Memoizeds `ruleProps` by converting the callbacks to a single object
  - Has a bunch of `render$TYPERules` callbacks for "inherited", "style", and "pseudo-element" rules, which depend on both `ruleProps` and `rulesQuery`
    - The first two just render a `<Rule>` with appropriate props, plus possibly some headers. The "pseudo-elements" section gets an accordion with items and a pref for whether it's open
  - All the rule elements are then memoized too
    - Really we can skip the `useCallbacks`, and move the "render X" methods inside the `useMemo`
  - Renders `<Toolbar>`, which contains `<SearchBox>`, state is controlled here in `<RulesApp>`
#####

### Rules Components

- `<Rules>`: literally just maps over a `RuleState[]` and renders `<Rule>`s
- `<Rule>`: renders a `<SourceLink>` (just formatting), `<Selector>`, and `Declarations>`
- `<Selector>`: has a `renderSelector()` method, but that call is commented out. **Is this dead?**
- `<Declarations>`: Maps over a `DeclarationsState[]` and renders `<Declaration>`
- `<Declaration>`: renders expander, styles, and a `<DeclarationValue>`
- `<DeclarationValue>`: depending on the value, returns a color/font/URI component, or just shows the string
- 
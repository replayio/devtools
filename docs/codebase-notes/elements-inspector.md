# Replay Elements Panel Codebase

## Overview

Generally lives in `devtools/client/inspector/`
  - subfolders for the various concepts / sub-tabs (`boxmodel`, `changes`, `computed`, `layout`, `markup`, `rules`, `event-listeners`). Each of those in turn mostly have their own `actions/reducers/components/selectors` subfolders
  - additional folders for shared code: `actions`, `reducers`, `state`, `shared`

### General Architecture

The React components mostly expect POJOs, like `NodeInfo` and `RuleState`.  These are generally stored in Redux.

However, the logic that drives those lives in `$PANELView` components like `RuleView`. These are singleton classes that are instantiated by the `Inspector` class.  They listen for `"new-node-front"` events from the `Selection` singleton, which stores a `NodeFront` value. They then grab the selected `NodeFront` instance and call various methods to fetch data like CSS rules, parent/child nodes, and other DOM details.  The fetched data is run through additional processing to determine things like CSS inheritance and overrides, box model layouts, computed properties, etc, and then put into Redux.

There's interaction with several vanilla JS classes for things like highlighting elements as you mouse over them,and some vanilla JS "components" for things like the "breadcrumbs" leading to the selected element.

In general, there's a lot of complex logic that really expects to work with `NodeFront`s.

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
  - Reads `state.rules.rules` (this had a buggy selector that returned an object, which I just fixed)
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


### Rules State - `class RulesView`

- Location: `./rules/rules.js`
- Setup:
  - Stores references to `inspector`, `selection`, `cssProperties`, `store`, and `outputParser`
  - Subscribes to `selection` events: `"new-node-front"` (a different node was selected) and `"detached-front"` (dead - not used in this codebase now)
- Getters:
  - Several getters that create singleton instances of `AutocompletePopup`, `ClassList`, `StyleInspectorMenu`
  - `dummyElement`: used by `text-property.ts` to determine how some styles get interpreted
  - `highlighters`
- Methods:
  - `getRulesProps()`: returns a ton of class methods like `onAddClass`, `onToggleClassPanelExpanded`, `showSelectorEditor`, etc. Odds are most of these are irrelevant in Replay.
  - `getNodeInfo()`: takes a DOM node and returns `{rule, type, value, view: "rule"}`
  - `getSelectorHighlighter()`: returns a `SelectorHighlighter` instance by calling `this.inspector.inspectorFront.getHighlightersByType()`
  - `onToggleSelectorHighlighter()`: disables any active nodes highlighter, and enables a new one. Also dispatches a Redux action with some selector info that updates `state.rules.highlightedSelector`
    - The old selector logic may be dead now?
  - `onAddClass`, `onAddRule`, `onSetClassState`, etc: generally forward to `this.classList.whatever()` or `this.elementStyle.whatever()` to live-modify styles in the page. These can probably go away.
  - `showDeclarationNameEditor()`, `showDeclarationValueEditor()`, `showNewDeclarationEditor()`, `showSelectorEditor()`: creates an `InplaceEditor` instance to handle editing a CSS property
  - `update()`: either `dispatch(updateRules())` if no element, or creates a `new ElementStyle()` object and calls `this.updateElementStyle()`
  - `updateElementStyle()`: awaits an empty `Promise`, calls `this.elementStyle.populate()`, calls `this.updateRules()`
  - `updateRules()`: just dispatches Redux actions for `updateRules` and `setComputedProperties`, both reading from the new `this.elementStyle`
  
  

### Rules Redux Logic


- `actions/class-list.ts`:
  - plain action creators for `updateClasses` and `updateClassPanelExpanded`
- `actions/rules.ts`: 
  - plain action creators for `updateAddRuleEnabled`, `updateHighlightedSelector`, `updateRules`, and `updateSourceLink`
  - `getDeclarationState:` maps a `declaration: TextProperty` class instance to a descriptive object with info about that CSS declaration
  - `getRuleState`: maps a `Rule` class instance to a descriptive object with info about the CSS rule
- `reducers/class-list.ts`: just updates a `classes[]` array and `isClassPanelExpanded`
- `reducers/rules.ts`: just updates `highlightedSelector`, `isAddRuleEnabled`, and `rules`; `"UPDATE_SOURCE_LINK"` updates one rule object to have a new `sourceLink` field

### Rules "Models"

There are several plain JS classes that are responsible for doing parsing and processing of CSS rules and declarations, all in `./rules/models/`:
  
#### `class ClassList`

- Location: `./rules/models/class-list.ts`: 
- has a module-scoped `WeakMap<NodeFront, ClassInfo[]>` cache of classes applied to a given node, and tracks which classes are and aren't applied
- manages classnames applied to a `NodeFront`. Currently half of its methods are commented out.

#### `class ElementStyle`

- Location: `./rules/models/element-style.ts`
- Fields:
  - `element: NodeFront`
  - `ruleView: RuleView`
  - `store: UIStore` (Redux)
    - Note: this actually mutates the store object itself, by adding `store.userProperties = new UserPoperties()`.  This is bizarre and we shouldn't do that.
    - Looks like `UserProperties` (which I will get to documenting shortly) is "CSS declarations mapped to properties that have been changed by the user", except that we don't allow editing anything any more so that _should_ be dead
  - `pageStyle: PageStyleFront`
  - `rules: Rule[]`
- Methods:
  - `populate()`: 
    - Resets `this.rules = []`
    - Calls `this.element.getAppliedRules()` (part of `NodeFront`)
      - in turn calls `client.CSS.getAppliedRules()` for the current pause, adds data to the `pause`, tries to unique-ify rules, and resolves a promise with `this._waiters.rules.resolve(uniqueRules.map())`
     - Gets a `StyleFront` with `this.element.getInlineStyles()`
       - side note: Several of these methods ultimately come down to `Pause.getDOMFront()`, which looks up internal objects by `objectId`, and looks at `data.preview[$FIELD_NAME]` to determine whether to create and return a `Node/Rule/Style/StyleSheetFront`
     - recurses upwards through parent DOM nodes to ask for their styles and applied rules
     - filters a list of pseudo-elements
     - calls `this.onRuleUpdated()`, which in turn calls `this.updateDeclarations()` for itself and all pseudo-elements
  - `_maybeAddRule()`: ignores system rules (Replay-specific edit), otherwise adds a `new Rule()` instance to `this.rules`
  - `updateDeclarations()`: 
    - Calls `this._getDeclarations()` to return a list of text property declarations for the element
    - Collects all computed properties
    - Finds property names, and loops over properties to find duplicate names and priorities / overriden values
  - `_hasUpdatedCSSVariable()`: dead
  - `_getDeclarations()`: loops over all rules to filter based on the current element/pseudo-element
  - bunch of other methods that have been commented out entirely (`modifySelector`, `toggleDeclaration`, `_getValueAndExtraPoperties`, etc)
  

#### `class Rule`

- Location: `./rules/models/rule.ts`
- Fields:
  - `elementStyle: ElementStyle`
  - `domRule: RuleFront | StyleFront`
  - `inherited: NodeFront | null`
  - `inspector: Inspector`
  - `textProps: TextProperty[]`
  - `store: UIStore`
- Setup:
  - Grabs a bunch of references like `store` and `cssProperties` off of the `elementStyle` argument
  - Populates `this.textProps = this._getTextProperties()`
- Getters:
  - `inheritance`: returns `{inheritedNodeId, inheritedSource}` describing where the rule is inherited from
  - `inheritedSource`: Calculates display name for the ancestor element
  - `selector`: returns `{getUniqueSelector, matchedSelectors, selectors, selectorText}`
  - `sourceLink`: returns `{label, title}`
  - `sourceLocation`: returns a `SourceLocation` for the rule declaration line
  - various other things like `title`, `line`, `column`
- Methods:
  - `getUniqueSelector`: returns a string by joining a `string[]` together. (This is `async`, but all the "inherited" async logic has been commented out)
  - `getTextProperties()`: 
    - calls `parseNamedDeclarations()` to get a list of properties from the style
    - access `store.userProperties` (!?!?!?) to look up property values based on a rule
    - creates new `TextProperties` instances for each property and returns them
  - bunch of other methods have been commented out entirely ( `_updateTextProperty`, `refresh`, `_getDisabledProperties`, etc)
  
#### `class TextProperty`

- Location: `./rules/models/text-property.ts`
- Fields: 
  - `rule: Rule`
  - `elementStyle: ElementStyle`
  - `userProperties: UserProperties`
  - `cssProperties: CSSProperties`
  - `computed: ComputedProperty[]`
  - buncha other strings and stuff
- Setup:
  - Grabs the various class references off of `elementStyle` and `inspector`
- Getters:
  - `computedProperties`: filters `this.computed` by name and returns some derived values
  - `isPropertyChanged`: returns whether the property has been modified by the user, by checking `this.userProperties`
  - `parsedValue`: returns a parsed property value from `outputParser`
- Methods:
  - `updateComputed()`:
    - Grabs `this.elementStyle.ruleView.dummyElement`
    - Clears out `dummyElement`'s CSS text
    - Sets the property on `dummyElement`
    - Determines the actual property values and priorities by checking what is now set on `dummyElement`

#### `class UserProperties`

- Location: `./rules/models/user-properties.ts`
- Stores a `Map<string, Record<string, string>>`: maps a style key (`objectId + name`) to an object of style values that have been overridden by the user
  - This _has_ to be dead given how Replay works, right?
  
  
### Other Rules Logic

- `utils/utils.js`: several utils to go from a a DOM node to a `Rule/Declaration`/etc; other utils to go from a DOM node to computed properties or info about shapes


## "Changes" Sub-Panel

This appears to be entirely dead.  There's a `ChangesView` class that isn't imported anywhere, and `ChangesApp` is only imported by `ChangesView`.

The `changesReducer` is being added to the store, but that's it.



## "Layout" Sub-Panel

### Entry Point - `<LayoutApp>`

- Location: `./layout/components/LayoutApp.js`
- Just renders a `<BoxModel>` with props from Redux. (Used to also render a "grid" section, but that render method isn't used now)

### Box Model Components

These live over in `./boxmodel/components/`

- `<BoxModel>`: renders `<BoxModelMain>`, `<BoxModelInfo>`, `<BoxModelProperties>`
- `<BoxModelMain>`:
  - Extracts all border/padding/margin values
  - Renders a lot of divs and spans to draw the box model shapes
  - Renders `<BoxModelEditable>` components to allow editing of these values
  - Bunch of key handling for switching between editable inputs and canceling editing
  - Calls `onShowBoxModelHighlighter()` based on mouse-over events
    - **Note**: this seems kinda half-broken atm. When I mouse over parts of the box model rectangles, I do see some highlight flickering in our video preview, but it doesn't stick even if I then keep the mouse still - it always goes away immediately
- `<BoxModelProperties>`: renders a list of `<ComputedProperty>` instances displaying values like `line-height: "normal"`
- `<ComputedProperty>`: formats a property name and value


### Box Model State - `class BoxModel`

- Location: `./boxmodel/box-model.js`
- Setup:
  - Stores references to `window.document`, `inspector`, and `store`
  - Subscribes to `selection.on("new-node-front")` for selection changes
- Getters:
  - `highlighters`: returns `this.inspector.highlighters`
- Methods:
  - `getComponentProps()`: returns methods for `onHide/ShowBoxModelHighlighter` and `onShowBoxModelEditor`
  - `updateBoxModel()`:
    - bails out if not visible or no selected element
    - Gets the selected `NodeFront` and waits for `nodeFront.getBoundingClientRect()/getComputedStyle()`
    - Parses values
    - Dispatches `updateLayout(layout)`
  - `onShowBoxModelEditor()`: should be dead
  - `onShowBoxModelHighlighter()`: calls `Highlighter.highlight(this.inspector.selection.nodeFront)`

## "Computed" Sub-Panel

### Entry Point - `<ComputedApp>`

- Location: `./computed/components/ComputedApp`
- Just renders `<ComputedToolbar>` and `<ComputedProperties>`

### Computed Components

- `<ComputedToolbar>`: semi-controlled inputs for "Filter Styles" and "Show Browser Styles"
- `<ComputedProperties>`: Reads `state.computed.*`, renders a list of `<ComputedProperty>` children
- `<ComputedProperty>`: Renders `<DeclarationValue>` and `<MatchedSelector>` components describing the property
- `<MatchedSelector>`: renders `<ExternalLink` and `<DeclarationValue>` describing the selector and property

### Computed Redux Logic:
  
- `computed/actions/index.ts`: 
  - A couple plain action creators for `setComputedPropertySearch` and `setShowBrowserStyles`, etc
  - `setComputedProperties`: async thunk that takes an `ElementStyle` and calls `createComputedProperties` to read values from the underlying `NodeFront`
  - `createComputedProperties`:
    - calls `await elementStyle.element.getComputedStyle()`
    - Creates `new OutputParser(document, CSSProperties)`
    - For every computed property, does some calculations around rules and inheritance, and calls `outputParser.parseCssProperty()` for each declaration
    
## "Event Listeners" Sub-PanelenersApp>`

Really just one component:

### Entry Point - `<EventList>`

- Location: `./event-listeners/EventListenersApp.tsx`
- In a `useEffect:
  - Subscribes to `selection.on("new-node-front")`
  - Calls `node.getEventListeners()` and `getFrameworkEventListeners(node)` and saves the results in state
- Groups and sorts listeners by name/type
- Maps over the listeners, calls `NodeFront` methos to get function location info, and handles clicks by jumping to the location source in the editor

## Highlighting

### Entry Point - `class Highlighter`

- Location: `src/highlighters/highlighter.ts`
- Setup:
  - Listens to `ThreadFront.on("paused")` and clears highlighting
- Methods:
  - `highlight(node: NodeFront)`:
    - waits for `node.getBoxModel()` if not available, then calls `this.boxModelHighlighter.show(node)`
    
### `class BoxModelHighlighter`

- Location: `src/devtools/server/actors/highlighters/box-model.js`
- Extends `AutoRefreshHighlighter`, which is a prototype-based "class" in `devtools/server/actors/highlighters/auto-refresh`
  - This has `.show()` and `.hide()`, which defer to child class `._show()` and `._hide()`
  - Saves `this.currentNode`
- Methods:
  - `_show()`: calls `this._update()`
  - `_update()`: calls `this._showBoxModel()`, which removes the `"hidden"` attribute on the overlay DOM node
  - `_updateBoxModel()`:
    - loops through all the box data and sets style attributes on the overlay DOM node
    - 
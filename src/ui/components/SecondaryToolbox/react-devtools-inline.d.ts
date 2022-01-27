// original implementation (in Flow)
//   https://github.com/facebook/react/blob/main/packages/react-devtools-inline/
//   https://github.com/facebook/react/blob/main/packages/react-devtools-shared/

https: declare module "react-devtools-inline/frontend" {
  import { ReactElement } from "react";

  // https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/devtools/views/DevTools.js

  type TabID = "components" | "profiler";

  export interface ReactDevToolsProps {
    bridge: FrontendBridge;
    browserTheme?: string;
    canViewElementSourceFunction?: (inspectedElement: InspectedElement) => boolean;
    defaultTab?: TabID;
    enabledInspectedElementContextMenu?: boolean;
    showTabBar?: boolean;
    store: Store;
    warnIfLegacyBackendDetected?: boolean;
    warnIfUnsupportedVersionDetected?: boolean;
    viewAttributeSourceFunction?: (id: number, path: Array<string | number>) => void;
    viewElementSourceFunction?: (id: number, inspectedElement: InspectedElement) => void;
    readOnly?: boolean;
    hideSettings?: boolean;
    hideToggleErrorAction?: boolean;
    hideToggleSuspenseAction?: boolean;
    hideLogAction?: boolean;
    hideViewSourceAction?: boolean;

    // This property is used only by the web extension target.
    // The built-in tab UI is hidden in that case, in favor of the browser's own panel tabs.
    // This is done to save space within the app.
    // Because of this, the extension needs to be able to change which tab is active/rendered.
    overrideTab?: TabID;

    // To avoid potential multi-root trickiness, the web extension uses portals to render tabs.
    // The root <DevTools> app is rendered in the top-level extension window,
    // but individual tabs (e.g. Components, Profiling) can be rendered into portals within their browser panels.
    componentsPortalContainer?: Element;
    profilerPortalContainer?: Element;

    // Loads and parses source maps for function components
    // and extracts hook "names" based on the variables the hook return values get assigned to.
    // Not every DevTools build can load source maps, so this property is optional.
    fetchFileWithCaching?: any;
    // TODO (Webpack 5) Hopefully we can remove this prop after the Webpack 5 migration.
    hookNamesModuleLoaderFunction?: Function;
  }
  export type ReactDevTools = ReactElement<ReactDevToolsProps>;

  // Wall
  // https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/types.js
  export type Wall = {
    listen(listener: (msg: any) => void): () => void;
    send(event: string, payload: any, transferable?: Array<any>): void;
  };

  type ElementType = 1 | 2 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

  // Bridge
  // https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/bridge.js

  type FrontendEvent =
    | "clearErrorsAndWarnings"
    | "clearErrorsForFiberID"
    | "clearNativeElementHighlight"
    | "clearWarningsForFiberID"
    | "copyElementPath"
    | "deletePath"
    | "getBridgeProtocol"
    | "getOwnersList"
    | "getProfilingData"
    | "getProfilingStatus"
    | "highlightNativeElement"
    | "inspectElement"
    | "logElementToConsole"
    | "overrideError"
    | "overrideSuspense"
    | "overrideValueAtPath"
    | "profilingData"
    | "reloadAndProfile"
    | "renamePath"
    | "savedPreferences"
    | "selectFiber"
    | "setTraceUpdatesEnabled"
    | "shutdown"
    | "startInspectingNative"
    | "startProfiling"
    | "stopInspectingNative"
    | "stopProfiling"
    | "storeAsGlobal"
    | "updateComponentFilters"
    | "updateConsolePatchSettings"
    | "viewAttributeSource"
    | "viewElementSource"
    | "NativeStyleEditor_measure"
    | "NativeStyleEditor_renameAttribute"
    | "NativeStyleEditor_setValue"
    | "overrideContext"
    | "overrideHookState"
    | "overrideProps"
    | "overrideState";

  type BackendEvent = string;

  type Bridge<E = string> = {
    send: (event: E, ...payload: any) => void;
    shutdown: () => void;
    // _flush: () => void;
    // overrideValueAtPath: () => void;
  };

  export type FrontendBridge = Bridge<FrontendEvent>;
  export type BackendBridge = Bridge<BackendEvent>;

  // Store
  // https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/devtools/store.js
  //
  // The store is the single source of truth for updates from the backend.
  // ContextProviders can subscribe to the Store for specific things they want to provide.

  export type Store = {
    _roots: readonly number[];
    // Renderer ID is needed to support inspection fiber props, state, and hooks.
    _rootIDToRendererID: Map<number, number>;
    // Map of ID to (mutable) Element.
    // Elements are mutated to avoid excessive cloning during tree updates.
    // The InspectedElement Suspense cache also relies on this mutability for its WeakMap usage.
    _idToElement: Map<number, Element>;

    // ...
    // ...
  };

  // Element
  // https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/devtools/views/Components/types.js
  //
  // Each element on the frontend corresponds to a Fiber on the backend.
  // Some of its information (e.g. id, type, displayName) come from the backend.
  // Other bits (e.g. weight and depth) are computed on the frontend for windowing and display purposes.
  // Elements are updated on a push basis– meaning the backend pushes updates to the frontend when needed.
  export type Element = {
    id: number;
    parentID: number;
    children: number[];
    type: ElementType;
    displayName: string | null;
    key: number | string | null;

    hocDisplayNames: string[] | null;

    // Should the elements children be visible in the tree?
    isCollapsed: boolean;

    // Owner (if available)
    ownerID: number;

    // How many levels deep within the tree is this element?
    // This determines how much indentation (left padding) should be used in the Elements tree.
    depth: number;

    // How many nodes (including itself) are below this Element within the tree.
    // This property is used to quickly determine the total number of Elements,
    // and the Element at any given index (for windowing purposes).
    weight: number;

    // This element is not in a StrictMode compliant subtree.
    // Only true for React versions supporting StrictMode.
    isStrictModeNonCompliant: boolean;
  };

  // from https://github.com/facebook/react/blob/main/packages/react-devtools-inline/src/frontend.js

  // Target aka 'window'
  export interface Target {
    postMessage(message: any, targetOrigin: string, transferable?: any[]): void;
  }

  export function createBridge(contentWindow: Target, wall?: Wall): FrontendBridge;
  export function createStore(
    bridge: FrontendBridge,
    config?: { supportsNativeInspection?: boolean }
  ): Store;
  export function initialize(
    contentWindow: Target,
    bridgeAndStore: { bridge?: FrontentBridge; store?: Store }
  ): typeof ReactDevTools;
}

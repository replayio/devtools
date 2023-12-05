import { inspect } from "util";

const TREE_OPERATION_ADD = 1;
const TREE_OPERATION_REMOVE = 2;
const TREE_OPERATION_REORDER_CHILDREN = 3;
const TREE_OPERATION_UPDATE_TREE_BASE_DURATION = 4;
const TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS = 5;
const TREE_OPERATION_REMOVE_ROOT = 6;
const TREE_OPERATION_SET_SUBTREE_MODE = 7;

const ElementTypeRoot = 11;

const PROFILING_FLAG_BASIC_SUPPORT = 0b01;
const PROFILING_FLAG_TIMELINE_SUPPORT = 0b10;

type ElementType = 1 | 2 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type Element = {
  id: number;
  parentID: number;
  children: Array<number>;
  type: ElementType;
  displayName: string | null;
  key: number | string | null;

  hocDisplayNames: null | Array<string>;

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

function utfDecodeString(array: Array<number>): string {
  // Avoid spreading the array (e.g. String.fromCodePoint(...array))
  // Functions arguments are first placed on the stack before the function is called
  // which throws a RangeError for large arrays.
  // See github.com/facebook/react/issues/22293
  let string = "";
  for (let i = 0; i < array.length; i++) {
    const char = array[i];
    string += String.fromCodePoint(char);
  }
  return string;
}

type ErrorAndWarningTuples = Array<{
  id: number;
  index: number;
}>;

type Capabilities = {
  supportsBasicProfiling: boolean;
  hasOwnerMetadata: boolean;
  supportsStrictMode: boolean;
  supportsTimeline: boolean;
};

const __DEV__ = true;
const StrictMode = 1;

export class Store {
  // Computed whenever _errorsAndWarnings Map changes.
  _cachedErrorCount: number = 0;
  _cachedWarningCount: number = 0;
  _cachedErrorAndWarningTuples: ErrorAndWarningTuples | null = null;
  // Should new nodes be collapsed by default when added to the tree?
  _collapseNodesByDefault: boolean = true;
  // Map of ID to number of recorded error and warning message IDs.
  _errorsAndWarnings: Map<
    number,
    {
      errorCount: number;
      warningCount: number;
    }
  > = new Map();
  // At least one of the injected renderers contains (DEV only) owner metadata.
  _hasOwnerMetadata: boolean = false;
  // Map of ID to (mutable) Element.
  // Elements are mutated to avoid excessive cloning during tree updates.
  // The InspectedElement Suspense cache also relies on this mutability for its WeakMap usage.
  _idToElement: Map<number, Element> = new Map();
  // Map of element (id) to the set of elements (ids) it owns.
  // This map enables getOwnersListForElement() to avoid traversing the entire tree.
  _ownersMap: Map<number, Set<number>> = new Map();
  // _profilerStore: ProfilerStore;
  _recordChangeDescriptions: boolean = false;
  // Incremented each time the store is mutated.
  // This enables a passive effect to detect a mutation between render and commit phase.
  _revision: number = 0;
  // This Array must be treated as immutable!
  // Passive effects will check it for changes between render and mount.
  _roots: ReadonlyArray<number> = [];
  _rootIDToCapabilities: Map<number, Capabilities> = new Map();
  // Renderer ID is needed to support inspection fiber props, state, and hooks.
  _rootIDToRendererID: Map<number, number> = new Map();
  // These options default to false but may be updated as roots are added and removed.
  _rootSupportsBasicProfiling: boolean = false;
  _rootSupportsTimelineProfiling: boolean = false;
  // _bridgeProtocol: BridgeProtocol | null = null;
  _bridgeProtocol: {
    version: 2;
  } = { version: 2 };
  // Total number of visible elements (within all roots).
  // Used for windowing purposes.
  _weightAcrossRoots: number = 0;

  constructor() {
    this._collapseNodesByDefault = false;
    this._recordChangeDescriptions = false;
  }

  get numElements(): number {
    return this._weightAcrossRoots;
  }

  get roots() {
    return this._roots;
  }

  getElementByID(id: number): Element | null {
    const element = this._idToElement.get(id);

    if (element == null) {
      // console.warn(`No element found with id "${id}"`);
      return null;
    }

    return element;
  }

  getElementAtIndex(index: number): Element | null {
    if (index < 0 || index >= this.numElements) {
      console.warn(`Invalid index ${index} specified; store contains ${this.numElements} items.`);
      return null;
    }

    // Find which root this element is in...
    let rootID;
    let root;
    let rootWeight = 0;

    for (let i = 0; i < this._roots.length; i++) {
      rootID = this._roots[i];
      root = this._idToElement.get(rootID) as any as Element;

      if (root.children.length === 0) {
        continue;
      } else if (rootWeight + root.weight > index) {
        break;
      } else {
        rootWeight += root.weight;
      }
    }

    // Find the element in the tree using the weight of each node...
    // Skip over the root itself, because roots aren't visible in the Elements tree.
    let currentElement = root as any as Element;
    let currentWeight = rootWeight - 1;

    while (index !== currentWeight) {
      const numChildren = currentElement.children.length;

      for (let i = 0; i < numChildren; i++) {
        const childID = currentElement.children[i];
        const child = this._idToElement.get(childID) as any as Element;
        const childWeight = child.isCollapsed ? 1 : child.weight;

        if (index <= currentWeight + childWeight) {
          currentWeight++;
          currentElement = child;
          break;
        } else {
          currentWeight += childWeight;
        }
      }
    }

    return (currentElement as any as Element) || null;
  }

  getErrorAndWarningCountForElementID(id: number): {
    errorCount: number;
    warningCount: number;
  } {
    return (
      this._errorsAndWarnings.get(id) || {
        errorCount: 0,
        warningCount: 0,
      }
    );
  }

  // This is only used in tests to avoid memory leaks.
  assertExpectedRootMapSizes() {
    if (this.roots.length === 0) {
      // The only safe time to assert these maps are empty is when the store is empty.
      this.assertMapSizeMatchesRootCount(this._idToElement, "_idToElement");
      this.assertMapSizeMatchesRootCount(this._ownersMap, "_ownersMap");
    }

    // These maps should always be the same size as the number of roots
    this.assertMapSizeMatchesRootCount(this._rootIDToCapabilities, "_rootIDToCapabilities");
    this.assertMapSizeMatchesRootCount(this._rootIDToRendererID, "_rootIDToRendererID");
  }

  // This is only used in tests to avoid memory leaks.
  assertMapSizeMatchesRootCount(map: Map<any, any>, mapName: string) {
    const expectedSize = this.roots.length;

    if (map.size !== expectedSize) {
      this._throwAndEmitError(
        Error(
          `Expected ${mapName} to contain ${expectedSize} items, but it contains ${
            map.size
          } items\n\n${inspect(map, {
            depth: 20,
          })}`
        )
      );
    }
  }

  _adjustParentTreeWeight: (parentElement: Element | null, weightDelta: number) => void = (
    parentElement,
    weightDelta
  ) => {
    let isInsideCollapsedSubTree = false;

    while (parentElement != null) {
      parentElement.weight += weightDelta;

      // Additions and deletions within a collapsed subtree should not bubble beyond the collapsed parent.
      // Their weight will bubble up when the parent is expanded.
      if (parentElement.isCollapsed) {
        isInsideCollapsedSubTree = true;
        break;
      }

      parentElement = this._idToElement.get(parentElement.parentID) as any as Element;
    }

    // Additions and deletions within a collapsed subtree should not affect the overall number of elements.
    if (!isInsideCollapsedSubTree) {
      this._weightAcrossRoots += weightDelta;
    }
  };

  _recursivelyUpdateSubtree(id: number, callback: (element: Element) => void): void {
    const element: Element | undefined = this._idToElement.get(id);

    if (element) {
      callback(element);
      (element as Element).children.forEach(child =>
        this._recursivelyUpdateSubtree(child, callback)
      );
    }
  }

  onBridgeOperations: (operations: Array<number>) => void = operations => {
    let haveRootsChanged = false;
    let haveErrorsOrWarningsChanged = false;
    // The first two values are always rendererID and rootID
    const rendererID = operations[0];
    const addedElementIDs: Array<number> = [];
    // This is a mapping of removed ID -> parent ID:
    const removedElementIDs: Map<number, number> = new Map();
    // We'll use the parent ID to adjust selection if it gets deleted.
    let i = 2;
    // Reassemble the string table.
    const stringTable: Array<string | null> = [
      null, // ID = 0 corresponds to the null string.
    ];
    const stringTableSize = operations[i++];
    const stringTableEnd = i + stringTableSize;

    while (i < stringTableEnd) {
      const nextLength = operations[i++];
      const nextString = utfDecodeString(operations.slice(i, i + nextLength) as any);
      stringTable.push(nextString);
      i += nextLength;
    }

    while (i < operations.length) {
      const operation = operations[i];

      switch (operation) {
        case TREE_OPERATION_ADD: {
          const id = operations[i + 1] as any as number;
          const type = operations[i + 2] as any as ElementType;
          i += 3;

          if (this._idToElement.has(id)) {
            this._throwAndEmitError(
              Error(`Cannot add node "${id}" because a node with that id is already in the Store.`)
            );
          }

          let ownerID = 0;
          let parentID: number = null as any as number;

          if (type === ElementTypeRoot) {
            const isStrictModeCompliant = operations[i] > 0;
            i++;
            const supportsBasicProfiling = (operations[i] & PROFILING_FLAG_BASIC_SUPPORT) !== 0;
            const supportsTimeline = (operations[i] & PROFILING_FLAG_TIMELINE_SUPPORT) !== 0;
            i++;
            let supportsStrictMode = false;
            let hasOwnerMetadata = false;

            // If we don't know the bridge protocol, guess that we're dealing with the latest.
            // If we do know it, we can take it into consideration when parsing operations.
            if (this._bridgeProtocol === null || this._bridgeProtocol.version >= 2) {
              supportsStrictMode = operations[i] > 0;
              i++;

              hasOwnerMetadata = operations[i] > 0;
              i++;
            }

            this._roots = this._roots.concat(id);

            this._rootIDToRendererID.set(id, rendererID);

            this._rootIDToCapabilities.set(id, {
              supportsBasicProfiling,
              hasOwnerMetadata,
              supportsStrictMode,
              supportsTimeline,
            });

            // Not all roots support StrictMode;
            // don't flag a root as non-compliant unless it also supports StrictMode.
            const isStrictModeNonCompliant = !isStrictModeCompliant && supportsStrictMode;

            this._idToElement.set(id, {
              children: [],
              depth: -1,
              displayName: null,
              hocDisplayNames: null,
              id,
              isCollapsed: false,
              // Never collapse roots; it would hide the entire tree.
              isStrictModeNonCompliant,
              key: null,
              ownerID: 0,
              parentID: 0,
              type,
              weight: 0,
            });

            haveRootsChanged = true;
          } else {
            parentID = operations[i] as any as number;
            i++;
            ownerID = operations[i] as any as number;
            i++;
            const displayNameStringID = operations[i];
            const displayName = stringTable[displayNameStringID];
            i++;
            const keyStringID = operations[i];
            const key = stringTable[keyStringID];
            i++;

            if (!this._idToElement.has(parentID)) {
              this._throwAndEmitError(
                Error(
                  `Cannot add child "${id}" to parent "${parentID}" because parent node was not found in the Store.`
                )
              );
            }

            const parentElement = this._idToElement.get(parentID) as any as Element;
            parentElement.children.push(id);

            const element: Element = {
              children: [],
              depth: parentElement.depth + 1,
              displayName,
              hocDisplayNames: null,
              id,
              isCollapsed: this._collapseNodesByDefault,
              isStrictModeNonCompliant: parentElement.isStrictModeNonCompliant,
              key,
              ownerID,
              parentID,
              type,
              weight: 1,
            };

            this._idToElement.set(id, element);

            addedElementIDs.push(id);

            this._adjustParentTreeWeight(parentElement, 1);

            if (ownerID > 0) {
              let set = this._ownersMap.get(ownerID);

              if (set === undefined) {
                set = new Set();

                this._ownersMap.set(ownerID, set);
              }

              set.add(id);
            }
          }

          break;
        }

        case TREE_OPERATION_REMOVE: {
          const removeLength = operations[i + 1] as any as number;
          i += 2;

          for (let removeIndex = 0; removeIndex < removeLength; removeIndex++) {
            const id = operations[i] as any as number;

            if (!this._idToElement.has(id)) {
              this._throwAndEmitError(
                Error(`Cannot remove node "${id}" because no matching node was found in the Store.`)
              );
            }

            i += 1;
            const element = this._idToElement.get(id) as any as Element;
            const { children, ownerID, parentID, weight } = element;

            if (children.length > 0) {
              this._throwAndEmitError(Error(`Node "${id}" was removed before its children.`));
            }

            this._idToElement.delete(id);

            let parentElement = null;

            if (parentID === 0) {
              this._roots = this._roots.filter(rootID => rootID !== id);

              this._rootIDToRendererID.delete(id);

              this._rootIDToCapabilities.delete(id);

              haveRootsChanged = true;
            } else {
              parentElement = this._idToElement.get(parentID) as any as Element;

              if (parentElement === undefined) {
                this._throwAndEmitError(
                  Error(
                    `Cannot remove node "${id}" from parent "${parentID}" because no matching node was found in the Store.`
                  )
                );
              }

              const index = parentElement.children.indexOf(id);
              parentElement.children.splice(index, 1);
            }

            this._adjustParentTreeWeight(parentElement, -weight);

            removedElementIDs.set(id, parentID);

            this._ownersMap.delete(id);

            if (ownerID > 0) {
              const set = this._ownersMap.get(ownerID);

              if (set !== undefined) {
                set.delete(id);
              }
            }

            if (this._errorsAndWarnings.has(id)) {
              this._errorsAndWarnings.delete(id);

              haveErrorsOrWarningsChanged = true;
            }
          }

          break;
        }

        case TREE_OPERATION_REMOVE_ROOT: {
          i += 1;
          const id = operations[1];

          const recursivelyDeleteElements = (elementID: number) => {
            const element = this._idToElement.get(elementID);

            this._idToElement.delete(elementID);

            if (element) {
              // Mostly for Flow's sake
              for (let index = 0; index < element.children.length; index++) {
                recursivelyDeleteElements(element.children[index]);
              }
            }
          };

          const root = this._idToElement.get(id) as any as Element;
          recursivelyDeleteElements(id);

          this._rootIDToCapabilities.delete(id);

          this._rootIDToRendererID.delete(id);

          this._roots = this._roots.filter(rootID => rootID !== id);
          this._weightAcrossRoots -= root.weight;
          break;
        }

        case TREE_OPERATION_REORDER_CHILDREN: {
          const id = operations[i + 1] as any as number;
          const numChildren = operations[i + 2] as any as number;
          i += 3;

          if (!this._idToElement.has(id)) {
            this._throwAndEmitError(
              Error(
                `Cannot reorder children for node "${id}" because no matching node was found in the Store.`
              )
            );
          }

          const element = this._idToElement.get(id) as any as Element;
          const children = element.children;

          const nextChildren: number[] = [];

          for (let j = 0; j < numChildren; j++) {
            const childID = operations[i + j];
            nextChildren[j] = childID;
          }

          if (children.length !== numChildren) {
            this._throwAndEmitError(
              Error(
                `Children cannot be added or removed during a reorder operation (current: ${children
                  .slice()
                  .sort()}, next: ${nextChildren.slice().sort()})})`
              )
            );
          }

          for (let j = 0; j < numChildren; j++) {
            const childID = nextChildren[j];
            children[j] = childID;

            if (__DEV__) {
              // This check is more expensive so it's gated by __DEV__.
              const childElement = this._idToElement.get(childID);

              if (childElement == null || childElement.parentID !== id) {
                console.error(
                  `Children cannot be added or removed during a reorder operation (current: ${children
                    .slice()
                    .sort()}, next: ${nextChildren.slice().sort()})})`
                );
              }
            }
          }

          i += numChildren;

          break;
        }

        case TREE_OPERATION_SET_SUBTREE_MODE: {
          const id = operations[i + 1];
          const mode = operations[i + 2];
          i += 3;

          // If elements have already been mounted in this subtree, update them.
          // (In practice, this likely only applies to the root element.)
          if (mode === StrictMode) {
            this._recursivelyUpdateSubtree(id, element => {
              element.isStrictModeNonCompliant = false;
            });
          }

          break;
        }

        case TREE_OPERATION_UPDATE_TREE_BASE_DURATION:
          // Base duration updates are only sent while profiling is in progress.
          // We can ignore them at this point.
          // The profiler UI uses them lazily in order to generate the tree.
          i += 3;
          break;

        case TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS: {
          const id = operations[i + 1];
          const errorCount = operations[i + 2];
          const warningCount = operations[i + 3];
          i += 4;

          if (errorCount > 0 || warningCount > 0) {
            this._errorsAndWarnings.set(id, {
              errorCount,
              warningCount,
            });
          } else if (this._errorsAndWarnings.has(id)) {
            this._errorsAndWarnings.delete(id);
          }

          haveErrorsOrWarningsChanged = true;
          break;
        }
        default:
          this._throwAndEmitError(new Error(`Unsupported Bridge operation "${operation}"`));
      }
    }

    this._revision++;
    // Any time the tree changes (e.g. elements added, removed, or reordered) cached inidices may be invalid.
    this._cachedErrorAndWarningTuples = null;

    if (haveErrorsOrWarningsChanged) {
      let errorCount = 0;
      let warningCount = 0;

      this._errorsAndWarnings.forEach(entry => {
        errorCount += entry.errorCount;
        warningCount += entry.warningCount;
      });

      this._cachedErrorCount = errorCount;
      this._cachedWarningCount = warningCount;
    }

    if (haveRootsChanged) {
      this._hasOwnerMetadata = false;
      this._rootSupportsBasicProfiling = false;
      this._rootSupportsTimelineProfiling = false;

      this._rootIDToCapabilities.forEach(
        ({ supportsBasicProfiling, hasOwnerMetadata, supportsTimeline }) => {
          if (supportsBasicProfiling) {
            this._rootSupportsBasicProfiling = true;
          }

          if (hasOwnerMetadata) {
            this._hasOwnerMetadata = true;
          }

          if (supportsTimeline) {
            this._rootSupportsTimelineProfiling = true;
          }
        }
      );
    }
  };

  // The Store should never throw an Error without also emitting an event.
  // Otherwise Store errors will be invisible to users,
  // but the downstream errors they cause will be reported as bugs.
  // For example, https://github.com/facebook/react/issues/21402
  // Emitting an error event allows the ErrorBoundary to show the original error.
  _throwAndEmitError(error: Error): never {
    // Throwing is still valuable for local development
    // and for unit testing the Store itself.
    throw error;
  }
}

type StateContext = {
  // Tree
  numElements: number;
  ownerSubtreeLeafElementID: number | null;
  selectedElementID: number | null;
  selectedElementIndex: number | null;

  // Search
  searchIndex: number | null;
  searchResults: Array<number>;
  searchText: string;

  // Owners
  ownerID: number | null;
  ownerFlatTree: Array<Element> | null;

  // Inspection element panel
  inspectedElementID: number | null;
};

export function printStore(
  store: Store,
  includeWeight: boolean = false,
  state: StateContext | null = null
): string {
  // Inlined inside `printStore` because it is serialized to run inside playwright script
  function printElement(element: Element, includeWeight: boolean = false): string {
    let key = "";
    if (element.key !== null) {
      key = ` key="${element.key}"`;
    }

    let hocDisplayNames = null;
    if (element.hocDisplayNames !== null) {
      hocDisplayNames = [...element.hocDisplayNames];
    }

    const hocs = hocDisplayNames === null ? "" : ` [${hocDisplayNames.join("][")}]`;

    let suffix = "";
    if (includeWeight) {
      suffix = ` (${element.isCollapsed ? 1 : element.weight})`;
    }

    const indent = "".padStart((element.depth + 1) * 2, " ");

    return `${indent}<(${element.id})${key}>${hocs}${suffix}`;
  }

  const snapshotLines = [];

  let rootWeight = 0;

  function printSelectedMarker(index: number): string {
    if (state === null) {
      return "";
    }
    return state.selectedElementIndex === index ? `→` : " ";
  }

  function printErrorsAndWarnings(element: Element): string {
    const { errorCount, warningCount } = store.getErrorAndWarningCountForElementID(element.id);
    if (errorCount === 0 && warningCount === 0) {
      return "";
    }
    return ` ${errorCount > 0 ? "✕" : ""}${warningCount > 0 ? "⚠" : ""}`;
  }

  const ownerFlatTree = state !== null ? state.ownerFlatTree : null;
  if (ownerFlatTree !== null) {
    snapshotLines.push("[owners]" + (includeWeight ? ` (${ownerFlatTree.length})` : ""));
    ownerFlatTree.forEach((element, index) => {
      const printedSelectedMarker = printSelectedMarker(index);
      const printedElement = printElement(element, false);
      const printedErrorsAndWarnings = printErrorsAndWarnings(element);
      snapshotLines.push(`${printedSelectedMarker}${printedElement}${printedErrorsAndWarnings}`);
    });
  } else {
    const errorsAndWarnings = store._errorsAndWarnings ?? new Map();
    if (errorsAndWarnings.size > 0) {
      let errorCount = 0;
      let warningCount = 0;
      errorsAndWarnings.forEach(entry => {
        errorCount += entry.errorCount;
        warningCount += entry.warningCount;
      });

      snapshotLines.push(`✕ ${errorCount}, ⚠ ${warningCount}`);
    }

    store.roots.forEach(rootID => {
      const { weight } = store.getElementByID(rootID) as Element;
      const maybeWeightLabel = includeWeight ? ` (${weight})` : "";

      // Store does not (yet) expose a way to get errors/warnings per root.
      snapshotLines.push(`[root (${rootID})]${maybeWeightLabel}`);

      for (let i = rootWeight; i < rootWeight + weight; i++) {
        const element = store.getElementAtIndex(i);

        if (element == null) {
          throw Error(`Could not find element at index "${i}"`);
        }

        const printedSelectedMarker = printSelectedMarker(i);
        const printedElement = printElement(element, includeWeight);
        const printedErrorsAndWarnings = printErrorsAndWarnings(element);
        snapshotLines.push(`${printedSelectedMarker}${printedElement}${printedErrorsAndWarnings}`);
      }

      rootWeight += weight;
    });

    // Make sure the pretty-printed test align with the Store's reported number of total rows.
    if (rootWeight !== store.numElements) {
      throw Error(
        `Inconsistent Store state. Individual root weights ("${rootWeight}") do not match total weight ("${store.numElements}")`
      );
    }

    // If roots have been unmounted, verify that they've been removed from maps.
    // This helps ensure the Store doesn't leak memory.
    store.assertExpectedRootMapSizes();
  }

  return snapshotLines.join("\n");
}

import assert from "assert";
import { ObjectId, PauseId, Node as ProtocolNode } from "@replayio/protocol";

import { parentNodesCache } from "replay-next/components/elements-old/suspense/DOMParentNodesCache";
import { Element, elementCache } from "replay-next/components/elements-old/suspense/ElementCache";
import { getDistanceFromRoot } from "replay-next/components/elements-old/utils/getDistanceFromRoot";
import { getItemWeight } from "replay-next/components/elements-old/utils/getItemWeight";
import { isNodeInSubTree } from "replay-next/components/elements-old/utils/isNodeInSubTree";
import { loadNodeSubTree } from "replay-next/components/elements-old/utils/loadNodeSubTree";
import { shouldDisplayNode } from "replay-next/components/elements-old/utils/shouldDisplayNode";
import { GenericListData } from "replay-next/components/windowing/GenericListData";
import { recordData as recordTelemetryData } from "replay-next/src/utils/telemetry";
import { ReplayClientInterface } from "shared/client/types";

import { Item, Metadata } from "./types";

export class ElementsListData extends GenericListData<Item> {
  private _destroyed: boolean = false;
  private _didError: boolean = false;
  private _idToMutableMetadataMap: Map<ObjectId, Metadata> = new Map();
  private _pauseId: PauseId;
  private _replayClient: ReplayClientInterface;
  private _rootObjectId: ObjectId | null = null;
  private _rootObjectIdWaiter: {
    promise: Promise<void>;
    resolve: () => void;
    resolved: boolean;
  };

  constructor(replayClient: ReplayClientInterface, pauseId: PauseId) {
    super();

    this.updateIsLoading(true);

    this._pauseId = pauseId;
    this._replayClient = replayClient;

    this._rootObjectIdWaiter = {
      resolved: false,
    } as any;
    this._rootObjectIdWaiter.promise = new Promise(resolve => {
      this._rootObjectIdWaiter.resolve = () => {
        this._rootObjectIdWaiter.resolved = true;
        resolve();
      };
    });
  }

  activate() {
    this._destroyed = false;
  }

  destroy() {
    this._destroyed = true;
  }

  didError = () => {
    return this._didError;
  };

  getParentItem(item: Item, isTail: boolean = false): Item {
    const parentId = item.element.node.parentNode;
    assert(parentId);

    const parentMetadata = this.getMutableMetadata(parentId);
    return {
      childrenCanBeRendered: parentMetadata.childrenCanBeRendered,
      depth: parentMetadata.depth,
      element: parentMetadata.element,
      id: parentId,
      isExpanded: parentMetadata.isExpanded,
      isTail,
    };
  }

  handleLoadingError(error: any) {
    console.error(error);

    this._didError = true;
    this.invalidate();
  }

  isNodeInSubTree(leafNodeId: ObjectId, rootNodeId: ObjectId): boolean {
    return isNodeInSubTree(this._replayClient, this._pauseId, leafNodeId, rootNodeId);
  }

  async loadPathToNode(leafNodeId: ObjectId) {
    let idPath;
    try {
      this.updateIsLoading(true);

      const isInitialLoad = this._rootObjectIdWaiter.resolved == false;
      const startTime = Date.now();

      idPath = await parentNodesCache.readAsync(this._replayClient, this._pauseId, leafNodeId);

      let expandedPathIndex = 0;

      // Expand the selected path as far as we can before loading
      for (expandedPathIndex = 0; expandedPathIndex < idPath.length; expandedPathIndex++) {
        const id = idPath[expandedPathIndex];
        // Don't use toggleNodeExpanded() or getMutableMetadata()
        // because this path isn't guaranteed to be loaded yet
        if (!this._idToMutableMetadataMap.has(id)) {
          break;
        }

        this.toggleNodeExpanded(id, true);
      }

      // Fetch in parallel but preserve a stable order; it's important for display
      const loadedIds: ObjectId[][] = [];
      try {
        await Promise.all(
          idPath.map((id, index) =>
            (async () => {
              const ids = await loadNodeSubTree(this._replayClient, this._pauseId, id, 0);
              loadedIds[index] = [...ids];
            })()
          )
        );
      } catch (error) {
        this.handleLoadingError(error);
        return;
      }

      await this._rootObjectIdWaiter.promise;

      const rootId = this._rootObjectId;
      assert(rootId);

      await this.processLoadedIds(rootId, new Set(loadedIds.flat()), 0);

      this.updateIsLoading(false);
      this.invalidate();

      // Finish expanding the selected path again now that all data has been loaded
      for (expandedPathIndex; expandedPathIndex < idPath.length; expandedPathIndex++) {
        const id = idPath[expandedPathIndex];
        this.toggleNodeExpanded(id, true);
      }

      const leafNode = this.getMutableMetadata(leafNodeId).element.node;
      const index = this.getIndexForNode(leafNodeId, leafNode);

      if (isInitialLoad) {
        const stopTime = Date.now();

        // Fire and forget telemetry (if enabled)
        recordTelemetryData("suspense-cache-load", {
          duration: stopTime - startTime,
          label: "LegacyElementsPanel",
          params: {
            pauseId: this._pauseId,
          },
        });
      }

      return index;
    } catch (error) {
      this.updateIsLoading(false);
      this.handleLoadingError(error);
    }
  }

  async registerRootNodeId(id: ObjectId, numLevelsToLoad: number = 3) {
    this._rootObjectId = id;
    this._rootObjectIdWaiter.resolve();

    await this.loadAndProcessNodeSubTree(id, numLevelsToLoad);

    if (this.getItemCount() > 0 && this.getSelectedIndex() === null) {
      this.setSelectedIndex(0);
    }
  }

  async toggleNodeExpanded(id: ObjectId, isExpanded: boolean) {
    let metadata = this.getMutableMetadata(id);
    const hasChildren = metadata.element.filteredChildNodeIds.length > 0;
    if (!hasChildren) {
      return;
    }

    if (metadata.isExpanded !== isExpanded) {
      const weightBefore = getItemWeight(metadata);

      metadata = {
        ...metadata,
        isExpanded,
      };

      const weightAfter = getItemWeight(metadata);
      const weightDelta = weightAfter - weightBefore;

      this._idToMutableMetadataMap.set(id, metadata);

      // Collapsed nodes should not affect a parent's weight
      let currentNodeId: ObjectId | undefined = metadata.element.node.parentNode;
      while (currentNodeId != null) {
        const metadata = this.getMutableMetadata(currentNodeId);

        const subTreeWeight = metadata.subTreeWeight + weightDelta;

        this._idToMutableMetadataMap.set(currentNodeId, {
          ...metadata,
          subTreeWeight,
        });

        if (!metadata.isExpanded) {
          break;
        }

        currentNodeId = metadata.element.node.parentNode;
      }

      this.invalidate();

      if (isExpanded) {
        await this.loadAndProcessNodeSubTree(id);
      }
    }
  }

  toDebugString() {
    let rows: string[] = [];
    for (let index = 0; index < this.getItemCount(); index++) {
      const item = this.getItemAtIndex(index);
      const { id, isTail } = item;
      const {
        childrenCanBeRendered,
        depth = 0,
        element,
        subTreeIsFullyLoaded,
        subTreeWeight,
      } = this.getMutableMetadata(id);
      if (depth >= 0 && !isTail) {
        const indentation = "  ".repeat(depth);
        const nodeName = element.node.nodeName.toLowerCase();
        rows.push(
          `${indentation} ${id}:${nodeName}${
            childrenCanBeRendered ? "" : " *"
          } (${subTreeWeight}, ${subTreeIsFullyLoaded ? "full" : "partial"})`
        );
      }
    }
    return rows.join("\n");
  }

  toString(): string {
    const count = this.getItemCountImplementation();

    let rows: string[] = [];

    for (let index = 0; index < count; index++) {
      const { childrenCanBeRendered, depth, element, isExpanded, isTail } =
        this.getItemAtIndex(index);
      const { node } = element;

      const indentation = "  ".repeat(depth);
      const nodeName = node.nodeName.toLowerCase();
      const hasChildren = element.filteredChildNodeIds.length > 0;

      let rendered;

      if (nodeName.startsWith("#")) {
        let nodeValue = node.nodeValue ?? "";
        nodeValue = nodeValue.trim();
        nodeValue = nodeValue.replace(/\n\s+/g, " ");

        if (node.nodeType === Node.COMMENT_NODE) {
          rendered = `<!-- ${nodeValue} -->`;
        } else {
          rendered = nodeValue || nodeName;
        }
      } else {
        if (hasChildren) {
          if (isExpanded) {
            if (isTail) {
              rendered = `</${nodeName}>`;
            } else {
              rendered = `<${nodeName}>`;
            }
          } else if (!childrenCanBeRendered) {
            rendered = `<${nodeName}>…</${nodeName}> *`;
          } else {
            rendered = `<${nodeName}>…</${nodeName}>`;
          }
        } else {
          rendered = `<${nodeName} />`;
        }
      }

      rows.push(`${indentation}${rendered}`);
    }

    return rows.join("\n");
  }

  protected getIndexForItemImplementation(item: Item): number {
    return this.getIndexForNode(item.id, item.element.node);
  }

  protected getIndexForNode(id: ObjectId, node: ProtocolNode): number {
    let currentNode: ProtocolNode | undefined = node;
    let currentNodeId: ObjectId | undefined = id;
    if (currentNode.parentNode == null) {
      return 0;
    }

    // Don't count the root node
    let index = -1;

    while (currentNode && currentNodeId) {
      if (currentNode.parentNode) {
        const parentMetadata = this.getMutableMetadata(currentNode.parentNode);
        const childNodes = parentMetadata.element.filteredChildNodeIds;

        for (let childIndex = 0; childIndex < childNodes.length; childIndex++) {
          const childNodeId = childNodes[childIndex];
          const childMetadata = this.getMutableMetadata(childNodeId);

          if (childNodeId === currentNodeId) {
            index++;
            break;
          } else if (shouldDisplayNode(childMetadata.element.node)) {
            index += getItemWeight(childMetadata);
          }
        }

        currentNodeId = currentNode.parentNode;
        currentNode = parentMetadata.element.node;
      } else {
        break;
      }
    }

    return index;
  }

  protected getItemAtIndexImplementation(index: number): Item {
    assert(this._rootObjectId);

    const rootMetadata = this.getMutableMetadata(this._rootObjectId);
    const rootNode = rootMetadata.element.node;

    // Skip the root (#DOCUMENT) node; we don't display that node
    let currentNodeId: ObjectId | undefined = undefined;
    let currentNodes = rootNode.childNodes ?? ([] as ObjectId[]);
    let currentIndex = 0;

    while (currentNodes.length > 0 && currentIndex <= index) {
      for (let nodeIndex = 0; nodeIndex < currentNodes.length; nodeIndex++) {
        currentNodeId = currentNodes[nodeIndex]!;

        const metadata = this.getMutableMetadata(currentNodeId);

        if (!shouldDisplayNode(metadata.element.node)) {
          // e.g. skip over things like empty #text nodes
          continue;
        }

        const weight = getItemWeight(metadata);

        if (currentIndex + weight > index) {
          // The element we're looking for is either this node itself or within its subtree
          // Break out of the for loop and start looking into the current child next

          const item: Item = {
            childrenCanBeRendered: metadata.childrenCanBeRendered,
            depth: metadata.depth,
            element: metadata.element,
            id: currentNodeId,
            isExpanded: metadata.isExpanded,
            isTail: false,
          };

          if (currentIndex === index) {
            return item;
          } else if (!metadata.childrenCanBeRendered && currentIndex + 1 === index) {
            return {
              ...item,
              depth: metadata.depth + 1,
              element: createLoadingPlaceholderElement(currentNodeId),
            };
          } else if (metadata.hasTail && currentIndex + weight - 1 === index) {
            return { ...item, isTail: true };
          } else {
            currentNodes = metadata.element.filteredChildNodeIds;
            currentIndex++;
            break;
          }
        } else {
          // Skip over the current node and keep looking
          currentIndex += weight;
        }
      }
    }

    throw Error(`Could not find node at index ${index}`);
  }

  protected getItemCountImplementation(): number {
    if (this._didError || this._rootObjectId === null) {
      return 0;
    }

    const rootMetadata = this._idToMutableMetadataMap.get(this._rootObjectId);
    if (rootMetadata == null) {
      return 0;
    }

    return rootMetadata.subTreeWeight;
  }

  private getMutableMetadata(id: ObjectId): Metadata {
    const metadata = this._idToMutableMetadataMap.get(id);
    assert(metadata, `Could not find metadata for ${id}`);
    return metadata;
  }

  private getSubTreeLoadedStatus(element: Element) {
    let childrenCanBeRendered = true;
    let subTreeIsFullyLoaded = true;

    const childNodes = element.filteredChildNodeIds;

    for (let childIndex = 0; childIndex < childNodes.length; childIndex++) {
      const childNodeId = childNodes[childIndex];
      const childMetadata = this._idToMutableMetadataMap.get(childNodeId);
      if (!childMetadata) {
        childrenCanBeRendered = false;
        subTreeIsFullyLoaded = false;
      } else if (!childMetadata.subTreeIsFullyLoaded) {
        subTreeIsFullyLoaded = false;
      }
    }

    return { childrenCanBeRendered, subTreeIsFullyLoaded };
  }

  private async loadAndProcessNodeSubTree(relativeRootId: ObjectId, numLevelsToLoad: number = 0) {
    let loadedIds;
    try {
      this.updateIsLoading(true);
      loadedIds = await loadNodeSubTree(
        this._replayClient,
        this._pauseId,
        relativeRootId,
        numLevelsToLoad
      );
    } catch (error) {
      this.updateIsLoading(false);
      this.handleLoadingError(error);
      return;
    }

    if (this._destroyed) {
      return;
    }

    await this.processLoadedIds(relativeRootId, loadedIds, numLevelsToLoad);

    this.updateIsLoading(false);
    this.invalidate();
  }

  private async processLoadedIds(
    relativeRootId: ObjectId,
    loadedIds: Set<ObjectId>,
    numLevelsToLoad: number
  ) {
    const ids = [...loadedIds];
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      if (!this._idToMutableMetadataMap.has(id)) {
        const element = elementCache.getValue(this._replayClient, this._pauseId, id);
        const node = element.node;

        // It's only safe to expand up to (but not including) the deepest level fetched
        // Because we can't know if a node contains (non-filtered) children until we've fetched them
        const distanceFromRoot = getDistanceFromRoot({
          nodeId: id,
          node,
          pauseId: this._pauseId,
          replayClient: this._replayClient,
          rootNodeId: relativeRootId,
        });
        const isExpanded = distanceFromRoot < numLevelsToLoad;

        let depth = -1;
        if (node.parentNode) {
          const parentMetadata = this.getMutableMetadata(node.parentNode);
          depth = parentMetadata.depth + 1;
        }

        const hasTail = element.node.nodeType !== Node.DOCUMENT_NODE;

        const { childrenCanBeRendered, subTreeIsFullyLoaded } =
          this.getSubTreeLoadedStatus(element);

        this._idToMutableMetadataMap.set(id, {
          childrenCanBeRendered,
          depth,
          element,
          hasTail,
          isExpanded,
          subTreeIsFullyLoaded,
          subTreeWeight: 0,
        });

        let currentNodeId: ObjectId | undefined = node.parentNode;

        while (currentNodeId) {
          const metadata = this.getMutableMetadata(currentNodeId);

          const { childrenCanBeRendered, subTreeIsFullyLoaded } = this.getSubTreeLoadedStatus(
            metadata.element
          );

          const subTreeWeight = metadata.element.filteredChildNodeIds.reduce(
            (subTreeWeight, childId) => {
              const metadata = this._idToMutableMetadataMap.get(childId);
              return metadata ? subTreeWeight + getItemWeight(metadata) : subTreeWeight;
            },
            0
          );

          this._idToMutableMetadataMap.set(currentNodeId, {
            ...metadata,
            childrenCanBeRendered,
            subTreeIsFullyLoaded,
            subTreeWeight,
          });

          currentNodeId = metadata.element.node.parentNode;
        }
      }
    }
  }
}

function createLoadingPlaceholderElement(parentId: ObjectId): Element {
  return {
    filteredChildNodeIds: [],
    id: `loading-placeholder-element-${parentId}`,
    node: {
      isConnected: true,
      nodeType: Node.TEXT_NODE,
      nodeName: "#text",
      nodeValue: "Loading…",
      parentNode: parentId,
    },
  };
}

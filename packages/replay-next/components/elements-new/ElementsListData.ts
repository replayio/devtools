import assert from "assert";
import { ObjectId, PauseId } from "@replayio/protocol";

import { domCache } from "replay-next/components/elements-new/suspense/DOMCache";
import { GenericListData } from "replay-next/components/windowing/GenericListData";
import { ReplayClientInterface } from "shared/client/types";

import { Item, Metadata, Node as NodeType } from "./types";

export class ElementsListData extends GenericListData<Item> {
  private _destroyed: boolean = false;
  private _didError: boolean = false;
  private _idToMutableMetadataMap: Map<ObjectId, Metadata> = new Map();
  private _pauseId: PauseId;
  private _replayClient: ReplayClientInterface;
  private _rootObjectId: ObjectId | null = null;

  constructor(
    replayClient: ReplayClientInterface,
    pauseId: PauseId,
    rootNode: NodeType | null = null
  ) {
    super();

    this._pauseId = pauseId;
    this._replayClient = replayClient;

    this.loadDOM(rootNode);
  }

  activate() {
    this._destroyed = false;
  }

  contains(objectId: ObjectId): boolean {
    return this._idToMutableMetadataMap.has(objectId);
  }

  destroy() {
    this._destroyed = true;
  }

  didError = () => {
    return this._didError;
  };

  getIndexForItemId(objectId: ObjectId): number {
    let currentMetadata: Metadata | null = this.getMutableMetadata(objectId);
    if (currentMetadata.parentObject == null) {
      return 0;
    }

    // Don't count the root node
    let index = -1;

    while (currentMetadata) {
      const parentMetadata: Metadata | null = this.getParentMutableMetadata(
        currentMetadata.objectId
      );
      if (parentMetadata) {
        const children = parentMetadata.children;

        for (let childIndex = 0; childIndex < children.length; childIndex++) {
          const childNode = children[childIndex];
          const childMetadata = this.getMutableMetadata(childNode.objectId);
          if (childMetadata === currentMetadata) {
            index++;
            break;
          } else {
            index += childMetadata.weight;
          }
        }

        currentMetadata = parentMetadata;
      } else {
        break;
      }
    }

    return index;
  }

  getParentItem(item: Item, isTail: boolean = false): Item {
    const parentMetadata = this.getParentMutableMetadata(item.objectId);
    assert(parentMetadata);

    return {
      attributes: parentMetadata.attributes,
      depth: parentMetadata.depth,
      displayMode: isTail ? "tail" : parentMetadata.isExpanded ? "head" : "collapsed",
      nodeType: parentMetadata.nodeType,
      objectId: parentMetadata.objectId,
      tagName: parentMetadata.tagName,
      textContent: parentMetadata.textContent,
    };
  }

  handleLoadingError(error: any) {
    console.error(error);

    this._didError = true;

    this.invalidate();
  }

  isNodeInSubTree(leafNodeId: ObjectId, rootNodeId: ObjectId): boolean {
    let current = this.getParentMutableMetadata(leafNodeId);
    while (current) {
      if (current.objectId === rootNodeId) {
        return true;
      } else {
        current = this.getParentMutableMetadata(current.objectId);
      }
    }

    return false;
  }

  search(text: string): number[] {
    text = text.toLocaleLowerCase();

    const matches: Set<number> = new Set();
    const count = this.getItemCount();

    for (let index = 0; index < count; index++) {
      const item = this.getItemAtIndex(index);
      const string = this.toStringItem(item).toLocaleLowerCase();
      if (string.includes(text)) {
        matches.add(index);
      }
    }

    return Array.from(matches);
  }

  selectNode(objectId: ObjectId | null) {
    if (objectId === null) {
      this.setSelectedIndex(null);
    } else {
      const metadata = this.getMutableMetadata(objectId);

      const idsToExpand: ObjectId[] = [];

      let currentNodeId = metadata.parentObject?.objectId;
      while (currentNodeId) {
        const metadata = this.getMutableMetadata(currentNodeId);
        if (!metadata.isExpanded) {
          idsToExpand.push(currentNodeId);
        }

        currentNodeId = metadata.parentObject?.objectId;
      }

      // Expand nodes in top -> down order because of how weight bubbling works
      while (idsToExpand.length > 0) {
        const id = idsToExpand.pop()!;
        this.toggleNodeExpanded(id, true);
      }

      const index = this.getIndexForItemId(objectId);

      this.setSelectedIndex(index);
    }
  }

  toggleNodeExpanded(id: ObjectId, isExpanded: boolean) {
    const metadata = this.getMutableMetadata(id);
    const hasChildren = metadata.children.length > 0;
    if (!hasChildren) {
      return;
    }

    if (metadata.isExpanded !== isExpanded) {
      const weightBefore = metadata.weight;

      let weightAfter = 1; // <tag> or <tag /> or <tag>...</tag>
      if (isExpanded) {
        for (let index = 0; index < metadata.children.length; index++) {
          const child = metadata.children[index];
          const childMetadata = this.getMutableMetadata(child.objectId);
          weightAfter += childMetadata.weight;
        }

        if (metadata.nodeType !== Node.DOCUMENT_NODE) {
          // #document nodes don't show a tail
          weightAfter++;
        }
      }

      metadata.isExpanded = isExpanded;
      metadata.weight = weightAfter;

      const weightDelta = weightAfter - weightBefore;

      let currentMetadata: Metadata | null = this.getParentMutableMetadata(metadata.objectId);
      while (currentMetadata != null) {
        currentMetadata.weight = currentMetadata.weight + weightDelta;

        if (!currentMetadata.isExpanded) {
          // Collapsed nodes should not affect a parent's weight
          break;
        }

        currentMetadata = this.getParentMutableMetadata(currentMetadata.objectId);
      }

      this.invalidate();
    }
  }

  toString(): string {
    const count = this.getItemCountImplementation();

    let rows: string[] = [];

    for (let index = 0; index < count; index++) {
      const item = this.getItemAtIndex(index);

      rows.push(this.toStringItem(item));
    }

    return rows.join("\n");
  }

  toStringItem(item: Item): string {
    const { attributes, depth, displayMode, nodeType, tagName, textContent } = item;

    let rendered;
    switch (nodeType) {
      case Node.DOCUMENT_NODE: {
        rendered = tagName;
        break;
      }
      case Node.TEXT_NODE: {
        rendered = textContent;
        break;
      }
      default: {
        assert(tagName);

        let attributesString = "";
        for (let name in attributes) {
          const value = attributes[name];
          if (value) {
            attributesString += ` ${name}="${value}"`;
          } else {
            attributesString += ` ${name}`;
          }
        }

        const openingTagNameAndAttributes = `${tagName}${attributesString}`;

        switch (displayMode) {
          case "collapsed":
            rendered = `<${openingTagNameAndAttributes}>…</${tagName}>`;
            break;
          case "empty":
            rendered = `<${openingTagNameAndAttributes} />`;
            break;
          case "head":
            rendered = `<${openingTagNameAndAttributes}>`;
            break;
          case "tail":
            rendered = `</${tagName}>`;
            break;
        }
        break;
      }
    }

    const indentation = "  ".repeat(depth);

    return `${indentation}${rendered}`;
  }

  protected getIndexForItemImplementation(item: Item): number {
    return this.getIndexForItemId(item.objectId);
  }

  protected getItemAtIndexImplementation(rowIndex: number): Item {
    assert(this._rootObjectId);

    const rootMetadata = this.getMutableMetadata(this._rootObjectId);

    // Skip the root (#DOCUMENT) node; we don't display that node
    let currentNodes = rootMetadata.children;
    let currentIndex = 0;

    while (currentNodes.length > 0 && currentIndex <= rowIndex) {
      for (let index = 0; index < currentNodes.length; index++) {
        const { attributes, children, nodeType, objectId, tagName, textContent } =
          currentNodes[index]!;

        const { depth, isExpanded, weight } = this.getMutableMetadata(objectId);

        if (currentIndex + weight > rowIndex) {
          // The element we're looking for is either this node itself or within its subtree.
          // Break out of the for loop and start looking into the current child next.

          if (currentIndex === rowIndex) {
            return {
              attributes,
              depth,
              displayMode: children.length > 0 ? (isExpanded ? "head" : "collapsed") : "empty",
              nodeType,
              objectId,
              tagName,
              textContent,
            };
          } else if (currentIndex + weight - 1 === rowIndex && nodeType !== Node.DOCUMENT_NODE) {
            return {
              attributes,
              depth,
              displayMode: "tail",
              nodeType,
              objectId,
              tagName,
              textContent,
            };
          } else {
            currentNodes = children;
            currentIndex++;
            break;
          }
        } else {
          // Skip over the current node and keep looking
          currentIndex += weight;
        }
      }
    }

    throw Error(`Could not find node at index ${rowIndex}`);
  }

  protected getItemCountImplementation(): number {
    if (this._didError || this._rootObjectId === null) {
      return 0;
    }

    const rootMetadata = this.getMutableMetadata(this._rootObjectId);
    if (rootMetadata.children.length === 0) {
      return 0;
    }

    // Don't count the root node itself
    // Remember #document nodes don't show a tail
    return rootMetadata.weight - 1;
  }

  private getMutableMetadata(id: ObjectId): Metadata {
    const metadata = this._idToMutableMetadataMap.get(id);
    assert(metadata, `Could not find metadata for ${id}`);
    return metadata;
  }

  private getParentMutableMetadata(id: ObjectId): Metadata | null {
    const metadata = this.getMutableMetadata(id);
    return metadata.parentObject ? this.getMutableMetadata(metadata.parentObject.objectId) : null;
  }

  private async loadDOM(rootNode: NodeType | null) {
    try {
      this.updateIsLoading(true);

      if (rootNode == null) {
        rootNode = await domCache.readAsync(this._replayClient, this._pauseId);
      }

      if (this._destroyed) {
        return;
      }

      if (rootNode) {
        this._rootObjectId = rootNode.objectId;

        let queue: Array<[depth: number, node: NodeType]> = [[-1, rootNode]];

        while (queue.length) {
          const [depth, node] = queue.shift()!;

          const metadata: Metadata = {
            ...node,
            depth,
            isExpanded: node.tagName !== "head",
            weight: 1,
          };

          this._idToMutableMetadataMap.set(node.objectId, metadata);

          let weightDelta = 1;
          let currentMetadata = this.getParentMutableMetadata(metadata.objectId);
          while (currentMetadata) {
            if (!currentMetadata.isExpanded) {
              break;
            }

            if (currentMetadata.weight === 1 && currentMetadata.nodeType !== Node.DOCUMENT_NODE) {
              // Transition from <node/> to <node>...</node>
              // Add an extra count for the tail row
              // #document nodes don't show a tail
              weightDelta++;
            }

            currentMetadata.weight += weightDelta;

            currentMetadata = this.getParentMutableMetadata(currentMetadata.objectId);
          }

          node.children.forEach(child => {
            queue.push([depth + 1, child]);
          });
        }
      }
    } catch (error) {
      console.error(error);

      this._didError = true;
    }

    this.updateIsLoading(false);
    this.invalidate();
  }
}

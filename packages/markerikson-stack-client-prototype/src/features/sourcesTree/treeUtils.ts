// Swiped and modified from https://github.com/pthm/node-path-list-to-tree/blob/master/src/index.ts

import type { SourceDetails } from "../sources/sourcesSlice";

export interface SourceTreeNode {
  name: string;
  protocol?: string;
  hostname?: string;
  isRoot: boolean;
  sourceDetails?: SourceDetails;
  children: SourceTreeNode[];
}

interface RootNames {
  protocol?: string;
  hostname?: string;
}

function createNode(
  path: string[],
  tree: SourceTreeNode[],
  isRoot: boolean,
  rootNames?: RootNames
): void {
  const name = path.shift()!;
  const idx = tree.findIndex((e: SourceTreeNode) => {
    return e.name == name;
  });
  if (idx < 0) {
    if (name) {
      const newTreeNode: SourceTreeNode = {
        name: name,
        children: [],
        isRoot,
        ...(isRoot ? rootNames : {}),
      };
      tree.push(newTreeNode);
      if (path.length !== 0) {
        createNode(path, newTreeNode.children, false);
      }
    }
  } else {
    createNode(path, tree[idx].children, false);
  }
}

const reRealPath = /^\/*(?<realPath>.+)/;

export function parseSourcesTree(data: SourceDetails[]): SourceTreeNode[] {
  const tree: SourceTreeNode[] = [];
  for (let detailsEntry of data) {
    if (!detailsEntry.url) {
      console.log("Skipping entry: ", detailsEntry);
      continue;
    }
    const url = new URL(detailsEntry.url);
    const { pathname, protocol, hostname } = url;
    const realPath = reRealPath.exec(pathname)?.groups?.["realPath"];
    if (realPath) {
      const split: string[] = realPath.split("/");
      if (hostname) {
        split.unshift(hostname);
      } else if (protocol) {
        split.unshift(protocol);
      }

      createNode(split, tree, true, { protocol, hostname });
    } else {
      console.log("No real path: ", detailsEntry);
    }
  }
  return tree;
}

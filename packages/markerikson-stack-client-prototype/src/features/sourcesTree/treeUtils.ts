// Swiped and modified from https://github.com/pthm/node-path-list-to-tree/blob/master/src/index.ts

import type { SourceDetails } from "../sources/sourcesSlice";

export interface SourceTreeNode {
  name: string;
  protocol?: string;
  hostname?: string;
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
    const newTreeNode: SourceTreeNode = {
      name: name,
      children: [],
      ...(isRoot ? rootNames : {}),
    };
    tree.push(newTreeNode);
    if (path.length !== 0) {
      createNode(path, newTreeNode.children, false);
    }
  } else {
    createNode(path, tree[idx].children, false);
  }
}

const reRealPath = /^\/*(?<realPath>.+)/;

export function parse(data: SourceDetails[]): SourceTreeNode[] {
  const tree: SourceTreeNode[] = [];
  for (let detailsEntry of data) {
    if (!detailsEntry.url) {
      continue;
    }
    const url = new URL(detailsEntry.url);
    const { pathname, protocol, hostname } = url;
    const realPath = reRealPath.exec(pathname)?.groups?.["realPath"];
    if (realPath) {
      const split: string[] = realPath.split("/");
      createNode(split, tree, true, { protocol, hostname });
    }
  }
  return tree;
}

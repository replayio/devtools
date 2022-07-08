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
  detailsEntry: SourceDetails,
  rootNames?: RootNames
): void {
  const name = path.shift()!;
  const isFile = path.length === 0;

  const existingTreeNode = tree.find((e: SourceTreeNode) => {
    let nameMatches = e.name == name;
    return nameMatches;
  });

  if (!existingTreeNode) {
    if (name) {
      const newTreeNode: SourceTreeNode = {
        name: name,
        children: [],
        isRoot,
        sourceDetails: detailsEntry,
        ...(isRoot ? rootNames : {}),
      };
      tree.push(newTreeNode);
      if (path.length !== 0) {
        createNode(path, newTreeNode.children, false, detailsEntry);
      }
    }
  } else {
    if (isFile) {
      if (existingTreeNode.sourceDetails?.kind !== "sourceMapped") {
        existingTreeNode.sourceDetails = detailsEntry;
      }
    } else {
      createNode(path, existingTreeNode.children, false, detailsEntry);
    }
  }
}

const reRealPath = /^\/*(?<realPath>.+)/;

const reIsJsSourceFile = /(js|ts)x?(\?[\w\d]+)*$/;

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
      if (detailsEntry.kind === "prettyPrinted") {
        continue;
      }
      // TODO We're throwing away possible HTML/index pieces here?
      if (detailsEntry.kind === "scriptSource" && !reIsJsSourceFile.test(realPath)) {
        continue;
      }
      const split: string[] = realPath.split("/");
      if (hostname) {
        split.unshift(hostname);
      } else if (protocol) {
        split.unshift(protocol);
      }

      createNode(split, tree, true, detailsEntry, { protocol, hostname });
    } else {
      console.log("No real path: ", detailsEntry);
    }
  }
  return tree;
}

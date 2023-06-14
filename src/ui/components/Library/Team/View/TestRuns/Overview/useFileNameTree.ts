import assert from "assert";
import { useMemo } from "react";

import { insert, insertString } from "replay-next/src/utils/array";
import { Recording } from "shared/graphql/types";
import { RecordingGroup } from "ui/utils/testRuns";

export function useFileNameTree(recordingGroup: RecordingGroup) {
  const { fileNameToRecordings } = recordingGroup;

  const sortedFileNames = useMemo(() => {
    const fileNames: string[] = [];
    for (let fileName in fileNameToRecordings) {
      insertString(fileNames, fileName);
    }
    return fileNames;
  }, [fileNameToRecordings]);

  const tree = useMemo<Tree>(() => {
    const root: Tree = {
      children: [],
      name: "",
      nestedRecordingCount: 0,
      pathNames: [],
      type: "path",
    };

    for (let fileName of sortedFileNames) {
      const recordings = fileNameToRecordings[fileName];

      const parts = fileName.split("/");

      const ancestors: PathNode[] = [root];

      let currentNode: PathNode = root;
      for (let index = 0; index < parts.length - 1; index++) {
        const part = parts[index];

        const existingNode = currentNode.children.find(child => child.name === part);
        if (existingNode) {
          assert(isPathNode(existingNode));
          currentNode = existingNode;
        } else {
          const pathNode: PathNode = {
            children: [],
            name: part,
            nestedRecordingCount: 0,
            pathNames: [part],
            type: "path",
          };

          insert(currentNode.children, pathNode, (a, b) => {
            const nameA = isPathNode(a) ? a.name : a.name;
            const nameB = isPathNode(b) ? b.name : b.name;
            return nameA.localeCompare(nameB);
          });

          currentNode = pathNode;
        }

        ancestors.push(currentNode);
      }

      const part = parts[parts.length - 1];
      let node = currentNode.children.find(child => child.name === part);
      if (node) {
        assert(isFileNode(node));
      } else {
        node = {
          name: part,
          recordings: [],
          type: "file",
        };

        insert(currentNode.children, node, (a, b) => a.name.localeCompare(b.name));
      }
      node.recordings.push(...recordings);

      ancestors.forEach(ancestor => {
        ancestor.nestedRecordingCount += recordings.length;
      });
    }

    // Flatten empty intermediate directories.
    //
    // So if we have:
    //    foo/
    //       bar/
    //          baz
    //          qux
    //
    // It can be flattened to
    //    foo/bar/
    //       baz
    //       qux
    const queue: PathNode[] = [root];
    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      if (currentNode.children.length === 1) {
        const childNode = currentNode.children[0];
        if (isPathNode(childNode)) {
          currentNode.pathNames.push(childNode.name);
          currentNode.name = currentNode.pathNames.join("/");
          currentNode.children = childNode.children;

          queue.push(currentNode);
          continue;
        }
      }

      currentNode.children.forEach(child => {
        if (isPathNode(child)) {
          queue.push(child);
        }
      });
    }

    return root;
  }, [fileNameToRecordings, sortedFileNames]);

  return tree;
}

export type Tree = PathNode;
export type TreeNode = FileNode | PathNode;

export type PathNode = {
  children: TreeNode[];
  name: string;
  nestedRecordingCount: number;
  pathNames: string[];
  type: "path";
};

export type FileNode = {
  name: string;
  recordings: Recording[];
  type: "file";
};

export function isFileNode(node: FileNode | PathNode): node is FileNode {
  return node.type === "file";
}

export function isPathNode(node: FileNode | PathNode): node is PathNode {
  return node.type === "path";
}

import assert from "assert";
import { useMemo } from "react";

import { insertString } from "replay-next/src/utils/array";
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
      children: {},
      nestedRecordingCount: 0,
      pathName: null,
      type: "path",
    };

    for (let fileName of sortedFileNames) {
      const recordings = fileNameToRecordings[fileName];

      const parts = fileName.split("/");

      const ancestors: PathNode[] = [root];

      let currentNode: PathNode = root;
      for (let index = 0; index < parts.length - 1; index++) {
        const part = parts[index];
        const existingNode = currentNode.children[part];
        if (existingNode) {
          assert(isPathNode(existingNode));
          currentNode = existingNode;
        } else {
          currentNode = currentNode.children[part] = {
            children: {},
            nestedRecordingCount: 0,
            pathName: part,
            type: "path",
          };
        }

        ancestors.push(currentNode);
      }

      const part = parts[parts.length - 1];
      let node = currentNode.children[part];
      if (node) {
        assert(isFileNode(node));
      } else {
        node = currentNode.children[part] = {
          fileName: part,
          recordings: [],
          type: "file",
        };
      }
      node.recordings.push(...recordings);

      ancestors.forEach(ancestor => {
        ancestor.nestedRecordingCount += recordings.length;
      });
    }

    return root;
  }, [fileNameToRecordings, sortedFileNames]);

  return tree;
}

export type Tree = PathNode;
export type TreeNode = FileNode | PathNode;

export type PathNode = {
  children: {
    [name: string]: TreeNode;
  };
  nestedRecordingCount: number;
  pathName: string | null;
  type: "path";
};

export type FileNode = {
  fileName: string;
  recordings: Recording[];
  type: "file";
};

export function isFileNode(node: FileNode | PathNode): node is FileNode {
  return node.type === "file";
}

export function isPathNode(node: FileNode | PathNode): node is PathNode {
  return node.type === "path";
}

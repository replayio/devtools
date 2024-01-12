import assert from "assert";
import { useMemo } from "react";

import { insert, insertString } from "replay-next/src/utils/array";
import { TestRunTestWithRecordings } from "shared/test-suites/TestRun";
import { TestGroup } from "ui/utils/testRuns";

export function useFileNameTree(testGroup: TestGroup, filterByText: string = "") {
  const { fileNameToTests } = testGroup;

  filterByText = filterByText.toLowerCase();

  const tree = useMemo<Tree>(() => {
    const sortedFileNames: string[] = [];
    for (let fileName in fileNameToTests) {
      if (
        filterByText === "" ||
        fileName.toLowerCase().includes(filterByText) ||
        fileNameToTests[fileName].some(test => test.title.toLowerCase().includes(filterByText))
      ) {
        insertString(sortedFileNames, fileName);
      }
    }

    const root: Tree = {
      children: [],
      name: "",
      nestedTestCount: 0,
      pathNames: [],
      type: "path",
    };

    for (let fileName of sortedFileNames) {
      const tests = fileNameToTests[fileName];

      const parts = fileName.split("/");

      const ancestors: PathNode[] = [root];

      let currentNode: PathNode = root;
      for (let index = 0; index < parts.length; index++) {
        const part = parts[index];

        const existingNode = currentNode.children.find(child => child.name === part);
        if (existingNode) {
          assert(isPathNode(existingNode));
          currentNode = existingNode;
        } else {
          const pathNode: PathNode = {
            children: [],
            name: part,
            nestedTestCount: 0,
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

      for (let test of tests) {
        insert(
          currentNode.children,
          {
            absolutePath: fileName,
            name: test.title,
            test,
            type: "file",
            nestedRecordingCount: test.executions.reduce(
              (executionTotal, execution) => executionTotal + execution.recordings.length,
              0
            ),
          },
          (a, b) => a.name.localeCompare(b.name)
        );
      }

      ancestors.forEach(ancestor => {
        ancestor.nestedTestCount += tests.length;
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
  }, [fileNameToTests, filterByText]);

  return tree;
}

export const treeContainFile = (treeNode: TreeNode[], file: string) => {
  let containsFile = false;
  treeNode.forEach(node => {
    if (isFileNode(node)) {
      if (node.absolutePath === file) {
        containsFile = true;
      }
    } else {
      if (treeContainFile(node.children, file)) {
        containsFile = true;
      }
    }
  });
  return containsFile;
};

export const treeContainTest = (treeNode: TreeNode[], testId: string) => {
  let containsFile = false;
  treeNode.forEach(node => {
    if (isFileNode(node)) {
      if (node.test.testId === testId) {
        containsFile = true;
      }
    } else {
      if (treeContainTest(node.children, testId)) {
        containsFile = true;
      }
    }
  });
  return containsFile;
};

export type Tree = PathNode;
export type TreeNode = FileNode | PathNode;

export type PathNode = {
  children: TreeNode[];
  name: string;
  nestedTestCount: number;
  pathNames: string[];
  type: "path";
};

export type FileNode = {
  absolutePath: string;
  name: string;
  test: TestRunTestWithRecordings;
  type: "file";
  nestedRecordingCount: number;
};

export function isFileNode(node: FileNode | PathNode): node is FileNode {
  return node.type === "file";
}

export function isPathNode(node: FileNode | PathNode): node is PathNode {
  return node.type === "path";
}

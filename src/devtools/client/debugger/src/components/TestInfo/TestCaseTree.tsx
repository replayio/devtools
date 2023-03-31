import React, { useMemo } from "react";

import { HookItem, TestItem } from "shared/graphql/types";

import { TestCaseRow } from "./TestCaseRow";

interface TestTree {
  branches: Record<string, TestTree>;
  tests: { index: number; test: TestItem }[];
  hooks: { index: number; hook: HookItem }[];
}

function createTree(): TestTree {
  return {
    branches: {},
    tests: [],
    hooks: [],
  };
}

function TestCaseBranch({ name, tree }: { name?: string; tree: TestTree }) {
  const branchNames = Object.keys(tree.branches);
  const hasBranches = branchNames.length > 0;
  const hasTests = tree.tests.length > 0;

  if (!hasBranches && !hasTests) {
    return null;
  }

  return (
    <>
      {name ? <li className="p-1">{name}</li> : null}
      <ol className={name ? "ml-3" : undefined}>
        {tree.hooks
          .filter(h => h.hook.title === "beforeAll")
          .map(h => (
            <div key={h.index}>Before All</div>
          ))}
        {branchNames.map(name => (
          <TestCaseBranch key={"branch-" + name} tree={tree.branches[name]} name={name} />
        ))}
        {tree.tests.map(t => (
          <TestCaseRow key={t.index} test={t.test} index={t.index} />
        ))}
        {tree.hooks
          .filter(h => h.hook.title === "afterAll")
          .map(h => (
            <div key={h.index}>After All</div>
          ))}
      </ol>
    </>
  );
}

export function TestCaseTree({ hooks, testCases }: { hooks?: HookItem[]; testCases: TestItem[] }) {
  const tree = useMemo(() => {
    const testCaseTree = testCases.reduce((acc, t, i) => {
      let branch = acc;
      const describes = t.path?.slice(3, t.path.length - 1);

      describes?.forEach(d => {
        if (!branch.branches[d]) {
          branch.branches[d] = createTree();
        }

        branch = branch.branches[d];
      });

      branch.tests.push({ index: i, test: t });

      return acc;
    }, createTree());

    hooks?.forEach((hook, index) => {
      if (hook.title === "beforeAll" || hook.title === "afterAll") {
        let branch = testCaseTree;
        hook.path.forEach(branchName => {
          branch = branch?.branches[branchName];
        });

        if (!branch) {
          console.error("Failed to find branch for test hook:", hook.path);
        } else {
          branch.hooks.push({
            index,
            hook,
          });
        }
      }
    });

    return testCaseTree;
  }, [hooks, testCases]);

  return <TestCaseBranch tree={tree} />;
}

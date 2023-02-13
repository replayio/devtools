import React, { useMemo } from "react";

import { TestItem } from "shared/graphql/types";

import { TestCaseRow } from "./TestCaseRow";

interface TestTree {
  branches: Record<string, TestTree>;
  tests: { index: number; test: TestItem }[];
}

function createTree(): TestTree {
  return {
    branches: {},
    tests: [],
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
        {branchNames.map(name => (
          <TestCaseBranch key={"branch-" + name} tree={tree.branches[name]} name={name} />
        ))}
        {tree.tests.map(t => (
          <TestCaseRow key={t.index} test={t.test} index={t.index} />
        ))}
      </ol>
    </>
  );
}
export function TestCaseTree({ testCases }: { testCases: TestItem[] }) {
  const tree = useMemo(
    () =>
      testCases.reduce((acc, t, i) => {
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
      }, createTree()),
    [testCases]
  );

  return <TestCaseBranch tree={tree} />;
}

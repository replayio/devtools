import type { SourceDetails } from "ui/reducers/sources";

import { createTree, updateTree } from "../updateTree";

describe("updateTree", () => {
  /*
  URLs taken from a Redux CodeSandbox recording:
  https://app.replay.io/recording/reduxts-csb-2--be1a4568-6c84-474c-a9eb-3a0491a792d8
  
  These demonstrate some key aspects of the sources tree behavior:
  - Multiple top-level folders
  - An "(index)" entry that is _not_ in a folder
  - Some nested folders that will be "collapsed" together
  - Sorting folders before files in the tree
  - Sorting files and folders alphabetically
  - Handling unusual "protocols" like "webpack://" and "replay-content://"
  - Current behavior when there's a name collision with different query params

  This array is intentionally written with these items
  out of order, to show that the sorting works correctly.
  */
  const partialPaths = [
    "src/index.tsx",
    "src/App.tsx",
    "src/app/store.ts",
    "src/app/hooks.ts",
    "webpack://BrowserFS/webpack/bootstrap",
    "(index)",
    "node_modules/redux/es/redux.js",
    "https://codesandbox.io/static/js/sandbox.js",
    "src/features/counter/Counter.tsx",
    "src/features/counter/counterAPI.ts",
    "src/features2/todos/todos.ts?1",
    "src/features2/todos/todos.ts?2",
    "replay-content:///react-devtools-hook-script",
    "https://codesandbox.io/static/js/vendors.js",
    "src/features/counter/counterSlice.ts",
    "webpack:////home/circleci/codesandbox-client/node_modules/core-js/fn/array/includes.js",
    "node_modules/react-redux/es/index.js",
    "node_modules/react-redux/es/types.js",
  ];

  // Anything that starts with "webpack", "https", or "replay-content" is a full URL
  const reIsFullURL = /^(webpack|https|replay-content)/;

  // Fake a set of SourceDetails objects based on these URLs
  const sources: SourceDetails[] = partialPaths.map(path => {
    // We don't care about most of the SourceDetails object
    // fields, but TS wants us to fill them in anyway.
    // Cast to skip them.
    return {
      id: path,
      url: reIsFullURL.test(path) ? path : `https://something.com/${path}`,
    } as SourceDetails;
  });
  // Turn them into a record keyed by URLs, as used in the real app
  const sourcesRecord = Object.fromEntries(sources.map(source => [source.url, source] as const));

  test("Generates a correctly sorted nested tree of sources and folders", () => {
    // This also calls `updateTree` and `collapseTree` internally
    const tree = createTree({ sources: sourcesRecord });

    // Use snapshots just to verify that nothing has changed.
    // This does exercise all the tree manipulation logic.
    expect(tree.uncollapsedTree).toMatchSnapshot();
    expect(tree.sourceTree).toMatchSnapshot();
  });
});

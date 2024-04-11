import { openDevToolsTab, startTest } from "../helpers";
import {
  openConsolePanel,
  verifyConsoleMessage,
  warpToLastMessage,
} from "../helpers/console-panel";
import {
  activateInspectorTool,
  getElementsListRow,
  searchElementsPanel,
} from "../helpers/elements-panel";
import {
  getAllVisibleComponentNames,
  getReactComponents,
  openReactDevtoolsPanel,
} from "../helpers/new-react-devtools-panel";
import { debugPrint, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "rdt-react-versions/dist/index.html" });

test("react_devtools-03: process and display multiple React versions in page", async ({
  pageWithMeta: { page, recordingId, testScope },
}) => {
  const queryParams = new URLSearchParams();
  // Force this test to always re-run the RDT (and other) routines
  // See pref names in packages/shared/user-data/GraphQL/config.ts
  queryParams.set("features", "backend_rerunRoutines");

  await startTest(page, recordingId, testScope, undefined, queryParams);

  await openDevToolsTab(page);

  await warpToLastMessage(page, "ExampleFinished");

  // If the "React" tab shows up, we know that the routine ran
  await openReactDevtoolsPanel(page);

  debugPrint(page, "Checking list of React components for versions 16, 17, and 18");

  const components = getReactComponents(page);
  await waitFor(async () => {
    const numComponents = await components.count();
    return expect(numComponents).toBeGreaterThan(0);
  });
  const numComponents = await components.count();

  // We should have roots for React 16, 17, and 18.
  // Each should be rendering:
  // <ReactVersionApp>
  //  <List>
  //    <Item>
  //  <FizzBuzzCounterClass> (currently not getting a sourcemapped name)
  //    <IsEven>
  //    <NoBuzz>
  expect(numComponents).toBe(18);

  const componentNames = await getAllVisibleComponentNames(page);

  expect(componentNames[0]).toBe("React16App");
  expect(componentNames[6]).toBe("React17App");
  expect(componentNames[12]).toBe("React18App");
  // We explicitly do not support React 15 or earlier
  expect(componentNames.includes("React15App")).toBe(false);

  debugPrint(page, "Verifying that React 15 was in the page");
  await openConsolePanel(page);
  // but React 15 should have rendered and executed in the page even if we didn't capture it
  await verifyConsoleMessage(page, "[15.7.0] Initial list");

  await activateInspectorTool(page);

  // and DOM nodes from React 15 should be in the page
  await searchElementsPanel(page, "15.7.0");
  const node = await getElementsListRow(page, { text: 'data-react-version="15.7.0"' });
  await node.waitFor();
});

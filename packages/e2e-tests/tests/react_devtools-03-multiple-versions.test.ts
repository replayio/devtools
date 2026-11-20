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
  searchComponents,
  verifySearchResults,
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

  debugPrint(page, "Checking list of React components for versions 16, 17, 18, and 19");

  // We should have roots for React 16, 17, 18, and 19.
  // Each should be rendering:
  // <ReactVersionApp>
  //  <List>
  //    <Item>
  //  <FizzBuzzCounterClass>
  //    <IsEven>
  //    <NoBuzz>
  // The list is virtualized, so the last rows of the React 19 root may not be rendered
  const components = getReactComponents(page);
  await waitFor(async () => {
    const numComponents = await components.count();
    return expect(numComponents).toBeGreaterThanOrEqual(19);
  });
  const componentNames = await getAllVisibleComponentNames(page);

  // Processor sessions do not map React 16 component names through sourcemaps,
  // so the React 16 root shows minified names there
  if (!process.env.E2E_PROCESSOR_SESSIONS) {
    expect(componentNames[0]).toBe("React16App");
  }
  expect(componentNames[6]).toBe("React17App");
  expect(componentNames[12]).toBe("React18App");
  expect(componentNames[18]).toBe("React19App");

  // The React 16 `NoBuzz` keeps its minified name on processor sessions
  await searchComponents(page, "NoBuzz");
  await verifySearchResults(page, {
    name: "NoBuzz",
    totalNumber: process.env.E2E_PROCESSOR_SESSIONS ? 3 : 4,
  });

  debugPrint(page, "Verifying that React 16 was in the page");
  await openConsolePanel(page);
  await verifyConsoleMessage(page, "[16.14.0] Initial list");

  await activateInspectorTool(page);

  await searchElementsPanel(page, "16.14.0");
  const node = await getElementsListRow(page, { text: 'data-react-version="16.14.0"' });
  await node.waitFor();

  debugPrint(page, "Verifying that React 19 was in the page");
  await openConsolePanel(page);
  await verifyConsoleMessage(page, "[19.3.1] Initial list");
});

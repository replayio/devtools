import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import {
  getAllVisibleComponentNames,
  getReactComponents,
  getReactDevToolsList,
  getReactDevToolsPanel,
  getSearchInput,
  getViewSourceButton,
  openReactDevtoolsPanel,
  searchComponents,
  verifySearchResults,
} from "../helpers/new-react-devtools-panel";
import { getSelectedLineNumber, waitForSelectedSource } from "../helpers/source-panel";
import { debugPrint, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

// Why is this even getting confused as an API key?
// trunk-ignore(gitleaks/generic-api-key)
test.use({ exampleKey: "breakpoints-01" });

test("react_devtools-02: RDT integrations (Chromium)", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  const queryParams = new URLSearchParams();
  // Force this test to always re-run the RDT (and other) routines
  // See pref names in packages/shared/user-data/GraphQL/config.ts
  queryParams.set("features", "backend_rerunRoutines");

  await startTest(page, recordingId, undefined, queryParams);

  await openDevToolsTab(page);

  await warpToMessage(page, "Waiting for breakpoint at doc_rr_basic.html:21 (waitForBreakpoint)");

  // If the "React" tab shows up, we know that the routine ran
  await openReactDevtoolsPanel(page);

  debugPrint(page, "Checking initial list of React components");

  await getReactDevToolsPanel(page).waitFor();
  const components = getReactComponents(page);
  const numComponents = await components.count();

  // Should be seeing 20-ish at least, but give some buffer.
  expect(numComponents).toBeGreaterThan(15);

  const componentNames = await getAllVisibleComponentNames(page);

  /*
    In production, the first 20-ish component names normally look like this (flattened):
    [
      "ea", 
      "J", 
      "X", 
      "z", 
      "Context.Provider", 
      "Context.Provider", 
      "Anonymous", 
      "Context.Provider", 
      "Context.Provider", 
      "Context.Provider", 
      "Context.Provider", 
      "n8", 
      "O", 
      "Anonymous", 
      "Anonymous"
      "Auth0Provider", 
      "iU",   
      "Context.Provider", 
      "Context.Consumer", 
      "da", 
      "dn"
      "Anonymous", 
      "Anonymous"
    ]

    In development, however, they are (minus dev-only components):

    [
      'Root',
      'Head',
      'AppContainer',
      'Container',
      'AppRouterContext.Provider',
      'SearchParamsContext.Provider',
      'PathnameContextProviderAdapter',
      'PathnameContext.Provider',
      'RouterContext.Provider',
      'HeadManagerContext.Provider',
      'ImageConfigContext.Provider',
      'App',
      'SystemProvider',
      'Head',
      'SideEffect',
      'Auth0Provider',
      'Auth0Provider', // twice? wut?
      'Context.Provider',
      'Context.Consumer',
      'SSRRecordingPage',
      'RecordingHead',
      'Head',
      'SideEffect'
    ]
    

    In practice, the routine's name processing currently lose the specific context names, 
    and a couple components aren't getting their names mapped.
    But, assuming the routine name mapping worked, we _should_ end up with this:
  */
  const expectedComponentNames = [
    "Root",
    "Head",
    "AppContainer",
    "Container",
    "Context.Provider",
    "Context.Provider",
    "PathnameContextProviderAdapter",
    "Context.Provider",
    "Context.Provider",
    "Context.Provider",
    "Context.Provider",
    "App",
    "SystemProvider",
    "Head",
    "SideEffect",
    "Auth0Provider",
    "iU",
    "Context.Provider",
    "Context.Consumer",
    "SSRRecordingPage",
    "RecordingHead",
    "Head",
    "SideEffect",
  ];

  debugPrint(page, "Checking list of rewritten component names");

  for (let i = 0; i < Math.min(expectedComponentNames.length, componentNames.length); i++) {
    expect(componentNames[i]).toBe(expectedComponentNames[i]);
  }

  debugPrint(page, `Checking "Jump to Component Source" for class component <SourcesTree>`);

  await searchComponents(page, "SourcesTree"); // Search and select 1st result
  await verifySearchResults(page, {
    currentNumber: 1,
    name: "WrappedSourcesTree",
    totalNumber: 2,
  });

  const componentSearchInput = getSearchInput(page);
  await componentSearchInput.focus();
  await componentSearchInput.press("Enter"); // Move to 2nd result
  await verifySearchResults(page, {
    currentNumber: 2,
    name: "SourcesTree",
    totalNumber: 2,
  });

  const viewSourceButton = getViewSourceButton(page);
  await viewSourceButton.click();

  // Should jump to the `render()` method in `<SourcesTree>`, which is a class component
  await waitForSelectedSource(page, "SourcesTree.tsx");
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, false);

    // TODO Line 98 is the constructor
    expect(lineNumber).toBe(98);
    // TODO View source should point to the render() function on line 280
    // expect(lineNumber).toBe(280);
  });

  // As of this recording, our `<SourceTreeItem>` is a function component that is wrapped
  // in `React.memo()`, and for some reason we're _not_ getting a real name for it (likely
  // due to use of `export default React.memo()`).
  // Still, this is a reasonable example to check "Jump to Component Source" behavior.

  debugPrint(page, `Checking "Jump to Component Source" for function component <SourcesTreeItem>`);

  const list = getReactDevToolsList(page);
  list.evaluate(element => {
    element.scrollTop = 0;
  });
  await getReactComponents(page).first().click();

  await searchComponents(page, "Anonymous"); // Search and select 1st result
  await verifySearchResults(page, {
    currentNumber: 1,
    totalNumber: 17,
  });

  await componentSearchInput.focus();
  await componentSearchInput.press("Enter");
  await componentSearchInput.press("Enter");
  await componentSearchInput.press("Enter");
  await verifySearchResults(page, {
    currentNumber: 4,
    totalNumber: 17,
  });

  await viewSourceButton.click();

  // Should jump to `function SourceTreeItem2()`, which is a function component
  await waitForSelectedSource(page, "SourcesTreeItem.tsx");
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, false);
    expect(lineNumber).toBe(133);
  });

  list.evaluate(el => (el.scrollTop = 0));

  // Re-select "App" just so we're back at the top
  await getReactComponents(page).first().click();

  // Should render `<Suspense>` components

  debugPrint(page, `Checking rendering of <Suspense> components`);

  await searchComponents(page, "Suspense");
  await verifySearchResults(page, {
    currentNumber: 1,
    totalNumber: 17,
  });

  list.evaluate(el => (el.scrollTop = 0));

  // Re-select "App" just so we're back at the top
  await getReactComponents(page).first().click();

  // Should render our `<LazyOffscreen>` components, but _not_ `<Offscreen>`,
  // because RDT already filters those out by default
  debugPrint(page, `Checking rendering of <Offscreen> components`);

  await searchComponents(page, "Offscreen");
  await verifySearchResults(page, {
    currentNumber: 1,
    totalNumber: 7,
  });

  const offscreenSearchComponentNames = await getAllVisibleComponentNames(page);
  expect(offscreenSearchComponentNames.length).toBeGreaterThan(0);
  expect(offscreenSearchComponentNames.includes("LazyOffscreen")).toBe(true);
  expect(offscreenSearchComponentNames.includes("Offscreen")).toBe(false);
});

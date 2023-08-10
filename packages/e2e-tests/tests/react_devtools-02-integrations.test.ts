import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import {
  getAllVisibleComponentNames,
  getComponentName,
  getComponentSearchResultsCount,
  getReactComponents,
  getSelectedComponent,
  openReactDevtoolsPanel,
} from "../helpers/react-devtools-panel";
import { getSelectedLineNumber, waitForSelectedSource } from "../helpers/source-panel";
import { getByTestName, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

// Why is this even getting confused as an API key?
// trunk-ignore(gitleaks/generic-api-key)
test.use({ exampleKey: "breakpoints-01" });

test("react_devtools 02: RDT integrations (Chromium)", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  const queryParams = new URLSearchParams();
  // Force this test to always re-run the RDT (and other) routines
  // See pref names in packages/shared/user-data/GraphQL/config.ts
  queryParams.set("features", "backend_rerunRoutines");

  await startTest(page, exampleKey, recordingId, undefined, queryParams);

  await openDevToolsTab(page);

  await warpToMessage(page, "Waiting for breakpoint at doc_rr_basic.html:21 (waitForBreakpoint)");

  // If the "React" tab shows up, we know that the routine ran
  await openReactDevtoolsPanel(page);

  const components = getReactComponents(page);
  await waitFor(async () => {
    const numComponents = await components.count();
    return expect(numComponents).toBeGreaterThan(0);
  });
  const numComponents = await components.count();

  // Should be seeing 20-ish at least, but give some buffer.
  expect(numComponents).toBeGreaterThan(15);

  const componentNames = await getAllVisibleComponentNames(components);

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
    "z",
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

  for (let i = 0; i < Math.min(expectedComponentNames.length, componentNames.length); i++) {
    expect(componentNames[i]).toBe(expectedComponentNames[i]);
  }

  // Test "Jump to Component Source" behavior
  const componentSearchInput = getByTestName(page, "ComponentSearchInput-Input");
  const nextSearchResultButton = getByTestName(page, "ComponentSearchInput-NextButton");
  const resetSearchButton = getByTestName(page, "ComponentSearchInput-ResetButton");

  await componentSearchInput.focus();
  await componentSearchInput.type("SourcesTree");
  // Should end up selecting "WrappedSourcesTree" - need the next result
  await nextSearchResultButton.click();

  const selectedSourcesTreeComponent = getSelectedComponent(page);
  const sourcesTreeName = await getComponentName(selectedSourcesTreeComponent);
  expect(sourcesTreeName).toBe("SourcesTree");

  const inspectedElementPanel = getByTestName(page, "InspectedElement-Title");
  // Two buttons, "inspect DOM node" and "view component source". neither has a label or text.
  const viewComponentSourceButton = inspectedElementPanel.getByRole("button").nth(1);
  await viewComponentSourceButton.click();

  // Should jump to the `render()` method in `<SourcesTree>`, which is a class component
  await waitForSelectedSource(page, "SourcesTree.tsx");
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, false);
    expect(lineNumber).toBe(280);
  });

  await resetSearchButton.click();
  await componentSearchInput.focus();
  // As of this recording, our `<SourceTreeItem>` is a function component that is wrapped
  // in `React.memo()`, and for some reason we're _not_ getting a real name for it (likely
  // due to use of `export default React.memo()`).
  // Still, this is a reasonable example to check "Jump to Component Source" behavior.
  await componentSearchInput.type("Anonymous");
  const anonymousResults = await getComponentSearchResultsCount(page);
  expect(anonymousResults).toEqual({ current: 1, total: 88 });
  await viewComponentSourceButton.click();

  // Should jump to `function SourceTreeItem2()`, which is a function component
  await waitForSelectedSource(page, "SourcesTreeItem.tsx");
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, false);
    expect(lineNumber).toBe(135);
  });

  const list = page.locator("[class^=DevTools] [class^=Tree] [class^=List]");

  list.evaluate(el => (el.scrollTop = 0));

  // Re-select "App" just so we're back at the top
  await getReactComponents(page).nth(0).click();

  // Should render `<Suspense>` components
  await resetSearchButton.click();
  await componentSearchInput.focus();
  await componentSearchInput.type("Suspense");

  const suspenseResults = await getComponentSearchResultsCount(page);
  expect(suspenseResults).toEqual({ current: 1, total: 89 });

  list.evaluate(el => (el.scrollTop = 0));

  // Re-select "App" just so we're back at the top
  await getReactComponents(page).nth(0).click();

  // Should render our `<LazyOffscreen>` components, but _not_ `<Offscreen>`,
  // because RDT already filters those out by default
  await resetSearchButton.click();
  await componentSearchInput.focus();
  await componentSearchInput.type("Offscreen");

  const offscreenResults = await getComponentSearchResultsCount(page);
  expect(offscreenResults).toEqual({ current: 1, total: 8 });

  const offscreenSearchVisibleComponents = getReactComponents(page);
  const offscreenSearchComponentNames = await getAllVisibleComponentNames(
    offscreenSearchVisibleComponents
  );

  expect(offscreenSearchComponentNames.length).toBeGreaterThan(0);
  expect(offscreenSearchComponentNames.includes("LazyOffscreen")).toBe(true);
  expect(offscreenSearchComponentNames.includes("Offscreen")).toBe(false);
});

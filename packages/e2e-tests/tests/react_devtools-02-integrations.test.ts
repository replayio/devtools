import { openDevToolsTab, startTest } from "../helpers";
import {
  executeTerminalExpression,
  findConsoleMessage,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";
import { getGetterValue } from "../helpers/object-inspector";
import {
  enableComponentPicker,
  getComponentName,
  getInspectedItem,
  getReactComponents,
  isComponentPickerEnabled,
  jumpToMessageAndCheckComponents,
  openReactDevtoolsPanel,
  waitForAndCheckInspectedItem,
} from "../helpers/react-devtools-panel";
import { hoverScreenshot } from "../helpers/screenshot";
import { delay, waitFor } from "../helpers/utils";
import test, { Page, expect } from "../testFixtureCloneRecording";

// WUT
// trunk-ignore(gitleaks/generic-api-key)
test.use({ exampleKey: "breakpoints-01" });

test.only("react_devtools 02: RDT integrations (Chromium)", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  page.on("console", msg => {
    const text = msg.text();
    if (/(The resource)|(Download the)/.test(text)) {
      return;
    }
    console.log("Console: ", msg);
  });

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

  const componentNames: string[] = await Promise.all(
    Array.from({ length: numComponents }).map(async (_, i) => {
      const component = components.nth(i);
      const wrapper = component.locator("[class^=Wrapper]");
      const name = await getComponentName(wrapper);
      return name;
    })
  );

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
});

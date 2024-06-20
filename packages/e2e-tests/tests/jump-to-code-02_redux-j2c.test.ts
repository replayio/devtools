import { Locator, Page, expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { getEventJumpButton } from "../helpers/info-event-panel";
import { getReduxActions, openReduxDevtoolsPanel } from "../helpers/redux-devtools-panel";
import { closeSource, verifyJumpToCodeResults } from "../helpers/source-panel";
import { getByTestName, waitFor } from "../helpers/utils";
import test from "../testFixture";

test.use({ exampleKey: "breakpoints-01" });

async function checkForJumpButton(actionListItem: Locator, shouldBeEnabled: boolean) {
  const jumpButton = getEventJumpButton(actionListItem);
  expect(await jumpButton.isVisible()).toBe(true);
  await jumpButton.hover();

  await waitFor(async () => {
    const buttonText = await getByTestName(jumpButton, "JumpToCodeButtonLabel").innerText();
    const expectedText = shouldBeEnabled ? "Jump to code" : "No results";
    expect(buttonText).toBe(expectedText);
  });

  return jumpButton;
}

async function clickReduxActionJumpButton(page: Page, actionListItem: Locator) {
  await actionListItem.scrollIntoViewIfNeeded();
  await actionListItem.hover();
  const jumpButton = await checkForJumpButton(actionListItem, true);
  await jumpButton.click();
}

async function jumpToReduxDispatch(page: Page, actionType: string, index = 0) {
  const reduxListItemsLocator = getReduxActions(page);
  const reduxSearchInput = page.locator("#redux-searchbox");

  await reduxSearchInput.fill(actionType);
  const actionListItem = reduxListItemsLocator.filter({ hasText: actionType }).nth(index);
  await clickReduxActionJumpButton(page, actionListItem);
}

test(`jump-to-code-02: Redux J2C functionality`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await openReduxDevtoolsPanel(page);

  const reduxListItemsLocator = getReduxActions(page);

  await waitFor(async () => {
    const numListItems = await reduxListItemsLocator.count();
    expect(numListItems).toBeGreaterThan(0);
  });

  // Inside of a thunk
  await jumpToReduxDispatch(page, "app/setRecordingId");
  await verifyJumpToCodeResults(page, "session.ts", 170, { current: 1, total: 1 });
  await closeSource(page, "session.ts");

  // Inside of the same thunk, after several awaits
  await jumpToReduxDispatch(page, "app/setRecordingTarget");
  await verifyJumpToCodeResults(page, "session.ts", 363, { current: 1, total: 1 });
  await closeSource(page, "session.ts");

  // Inside of one of the bootstrapping functions that receives the store
  // should be "debugger/src/client/index.ts"
  await jumpToReduxDispatch(page, "sources/allSourcesReceived");
  await verifyJumpToCodeResults(page, "index.ts", 13, { current: 1, total: 1 });
  await closeSource(page, "index.ts");

  // Inside of an RTK listener middleware effect
  jumpToReduxDispatch(page, "tabs/tabsRestored");
  await verifyJumpToCodeResults(page, "newSources.ts", 43, { current: 1, total: 1 });
  await closeSource(page, "newSources.ts");

  // Inside of a `useEffect`
  jumpToReduxDispatch(page, "set_selected_primary_panel");
  await verifyJumpToCodeResults(page, "SidePanel.tsx", 57, { current: 1, total: 1 });
  await closeSource(page, "SidePanel.tsx");

  // Inside of a `connect()`ed class component, with `this.props.setExpandedState()`.
  // Note that this appears to be one or two execution ticks off, so the line hit won't
  // line up perfectly, but it should still _display_ as "1/4"
  jumpToReduxDispatch(page, "SET_EXPANDED_STATE");
  await verifyJumpToCodeResults(page, "SourcesTree.tsx", 196, { current: 1, total: 4 });
  await closeSource(page, "SourcesTree.tsx");

  // Inside of an adapter that passes dispatch-wrapped actions to <QuickOpenModal>
  // This is also one tick off, but should still _display_ as "1/3"
  jumpToReduxDispatch(page, "quickOpen/setQuickOpenQuery");
  await verifyJumpToCodeResults(page, "QuickOpenModal.tsx", 551, { current: 1, total: 3 });
  await closeSource(page, "QuickOpenModal.tsx");
});

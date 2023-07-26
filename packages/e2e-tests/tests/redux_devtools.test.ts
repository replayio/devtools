import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  assertTabValue,
  getReduxActions,
  openReduxDevtoolsPanel,
  waitForReduxActionCount,
} from "../helpers/redux-devtools-panel";
import { enableReduxDevtools } from "../helpers/settings";

test("redux_devtools: Test Redux DevTools.", async ({ page }) => {
  await startTest(page, "redux/dist/index.html");
  await openDevToolsTab(page);

  await enableReduxDevtools(page);
  await openReduxDevtoolsPanel(page);

  await waitForReduxActionCount(page, 4);

  // We need to store the text content of these tabs for previous point
  // as on switching, initially it takes a little while for them to load
  // and there isn't any way to check in playwright when the new point was loaded and update happened
  // So we wait on the tab till the prev text is not the same as new one
  const tabState = { Action: "", State: "", Diff: "" };

  await getReduxActions(page).nth(0).click();

  await assertTabValue(
    page,
    tabState,
    "Action",
    'payload: 2\ntype: "counter/incrementByAmount"\n[[Prototype]]: Object'
  );
  await assertTabValue(page, tabState, "State", "counter: {value: 2}\n[[Prototype]]: Object");
  await assertTabValue(page, tabState, "Diff", 'counter:{"value":2}');

  await getReduxActions(page).nth(1).click();

  await assertTabValue(
    page,
    tabState,
    "Action",
    'payload: undefined\ntype: "counter/decrement"\n[[Prototype]]: Object'
  );
  await assertTabValue(page, tabState, "State", "counter: {value: 1}\n[[Prototype]]: Object");
  await assertTabValue(page, tabState, "Diff", "▶\ncounter\nvalue:2 => 1");

  await getReduxActions(page).nth(2).click();

  await assertTabValue(
    page,
    tabState,
    "Action",
    'payload: undefined\ntype: "decrement/increment"\n[[Prototype]]: Object'
  );
  await assertTabValue(page, tabState, "State", "counter: {value: 0}\n[[Prototype]]: Object");
  await assertTabValue(page, tabState, "Diff", "▶\ncounter\nvalue:1 => 0");
});

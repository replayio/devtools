import { openDevToolsTab, startTest } from "../helpers";
import {
  assertTabValue,
  getReduxActions,
  openReduxDevtoolsPanel,
  waitForReduxActionCount,
} from "../helpers/redux-devtools-panel";
import { enableReduxDevtools } from "../helpers/settings";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "redux/dist/index.html" });

test("redux_devtools: Test Redux DevTools.", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, exampleKey, recordingId);
  await openDevToolsTab(page);

  await enableReduxDevtools(page);
  await openReduxDevtoolsPanel(page);

  await waitForReduxActionCount(page, 4);

  await getReduxActions(page).nth(0).click();

  await assertTabValue(
    page,
    "Action",
    'payload: 2\ntype: "counter/incrementByAmount"\n[[Prototype]]: Object'
  );
  await assertTabValue(page, "State", "counter: {value: 2}\n[[Prototype]]: Object");
  await assertTabValue(page, "Diff", 'counter:{"value":2}');

  await getReduxActions(page).nth(1).click();

  await assertTabValue(
    page,
    "Action",
    'payload: undefined\ntype: "counter/decrement"\n[[Prototype]]: Object'
  );
  await assertTabValue(page, "State", "counter: {value: 1}\n[[Prototype]]: Object");
  await assertTabValue(page, "Diff", "▶\ncounter\nvalue:2 => 1");

  await getReduxActions(page).nth(2).click();

  await assertTabValue(
    page,

    "Action",
    'payload: undefined\ntype: "decrement/increment"\n[[Prototype]]: Object'
  );
  await assertTabValue(page, "State", "counter: {value: 0}\n[[Prototype]]: Object");
  await assertTabValue(page, "Diff", "▶\ncounter\nvalue:1 => 0");
});

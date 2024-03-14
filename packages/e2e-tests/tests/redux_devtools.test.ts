import { openDevToolsTab, startTest } from "../helpers";
import {
  assertTabValue,
  getReduxActions,
  openReduxDevtoolsPanel,
  waitForReduxActionCount,
} from "../helpers/redux-devtools-panel";
import test from "../testFixture";

test.use({ exampleKey: "redux/dist/index.html" });

test("redux_devtools: Test Redux DevTools.", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await openReduxDevtoolsPanel(page);

  await waitForReduxActionCount(page, 4);

  await getReduxActions(page).nth(0).click();

  await assertTabValue(page, "Action", 'payload: 2\ntype: "counter/incrementByAmount"');
  await assertTabValue(page, "State", "counter: {value: 2}");
  await assertTabValue(page, "Diff", 'counter:{"value":2}');

  await getReduxActions(page).nth(1).click();

  await assertTabValue(page, "Action", 'payload: undefined\ntype: "counter/decrement"');
  await assertTabValue(page, "State", "counter: {value: 1}");
  await assertTabValue(page, "Diff", "▶\ncounter\nvalue:2 => 1");

  await getReduxActions(page).nth(2).click();

  await assertTabValue(page, "Action", 'payload: undefined\ntype: "counter/decrement"');
  await assertTabValue(page, "State", "counter: {value: 0}");
  await assertTabValue(page, "Diff", "▶\ncounter\nvalue:1 => 0");
});

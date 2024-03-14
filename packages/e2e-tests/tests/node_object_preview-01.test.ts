import { startTest } from "../helpers";
import {
  findConsoleMessage,
  openConsolePanel,
  verifyConsoleMessage,
} from "../helpers/console-panel";
import { getByTestName } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "node/objects.js" });

test("node_object_preview: Showing console objects in node", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);

  await openConsolePanel(page);

  await verifyConsoleMessage(page, "(20) [0, 1, 2, 3, 4,");
  await verifyConsoleMessage(page, "Uint8Array(20) [0, 1, 2, 3, 4,");
  await verifyConsoleMessage(page, "Set(22) [{…}, {…}, 0, 1, 2,");
  await verifyConsoleMessage(page, "Map(21) {{…} → {…}, 0 → 1, 1 → 2, 2 → 3, 3 → 4,");
  await verifyConsoleMessage(page, "WeakSet(20) [{…}, {…}, {…},");
  await verifyConsoleMessage(page, "WeakMap(20) {{…} → {…}, {…} → {…},");
  await verifyConsoleMessage(page, "{a: 0, a0: 0, a1: 1, a2: 2, a3: 3,");
  await verifyConsoleMessage(page, "/abc/gi");
  await verifyConsoleMessage(page, "Tue Feb 13 2024");

  await verifyConsoleMessage(page, "RangeError: foo");

  const functionMessage = await findConsoleMessage(page, "bar()");
  const jumpIcon = getByTestName(functionMessage, "JumpToDefinitionButton");
  const count = await jumpIcon.count();
  expect(count).toBe(1);

  // Note the ellipsis character here
  await verifyConsoleMessage(page, `(6) [undefined, true, 3, null, "z", …]`);
  await verifyConsoleMessage(page, "Proxy");
  await verifyConsoleMessage(page, "Symbol()");
  await verifyConsoleMessage(page, "Symbol(symbol)");
  await verifyConsoleMessage(page, `{Symbol(): 42, Symbol(symbol): Symbol()}`);
});

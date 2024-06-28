import { openDevToolsTab, startTest } from "../helpers";
import { verifyConsoleMessage } from "../helpers/console-panel";
import { addLogpoint, editLogPoint, removeConditional } from "../helpers/source-panel";
import test from "../testFixture";

const lineNumber = 20;
test.use({ exampleKey: "doc_rr_basic.html" });

test(`logpoints-12: should auto save when removing conditions`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await addLogpoint(page, {
    content: '"initial"',
    lineNumber,
    saveAfterEdit: true,
    url: exampleKey,
  });
  await verifyConsoleMessage(page, "initial", "log-point", 10);

  // Add a condition that will hide console logs
  await editLogPoint(page, {
    condition: "false",
    lineNumber,
    saveAfterEdit: true,
    url: exampleKey,
  });
  await verifyConsoleMessage(page, "initial", "log-point", 0);

  // Remove condition and verify there are now console logs
  await removeConditional(page, { lineNumber });
  await verifyConsoleMessage(page, "initial", "log-point", 10);

  // Re-add a condition that will hide console logs
  await editLogPoint(page, {
    condition: "false",
    lineNumber,
    saveAfterEdit: true,
    url: exampleKey,
  });

  // Start a pending edit
  await editLogPoint(page, {
    content: '"updated"',
    lineNumber,
    saveAfterEdit: false,
    url: exampleKey,
  });

  // Verify no console logs
  await verifyConsoleMessage(page, "updated", "log-point", 0);

  // Remove condition and verify the pending edit was also saved
  await removeConditional(page, { lineNumber });
  await verifyConsoleMessage(page, "updated", "log-point", 10);
});

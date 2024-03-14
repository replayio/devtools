import { openDevToolsTab, startTest } from "../helpers";
import { waitForTerminal, warpToMessage } from "../helpers/console-panel";
import {
  closeBreakpointsAccordionPane,
  closeCallStackAccordionPane,
  closePrintStatementsAccordionPane,
  getScopeChildren,
  openPauseInformationPanel,
  openScopesAccordionPane,
} from "../helpers/pause-information-panel";
import { toggleExpandable } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "doc_rr_objects.html" });

test(`object_preview-02: should allow objects in scope to be inspected`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await waitForTerminal(page);

  await warpToMessage(page, "Done");

  await openPauseInformationPanel(page);

  await closeBreakpointsAccordionPane(page);
  await closePrintStatementsAccordionPane(page);
  await closeCallStackAccordionPane(page);
  await openScopesAccordionPane(page);

  const blockScope = getScopeChildren(page, "foo").first();

  // We should be able to expand the window and see its properties.
  await toggleExpandable(page, {
    scope: blockScope,
    text: "this",
  });

  await expect(blockScope).toContainText("Uint8Array");
  await expect(blockScope).toContainText("ƒbar");
  await expect(blockScope).toContainText("[0 … 99]");
});

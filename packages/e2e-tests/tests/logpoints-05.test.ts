import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  addLogpoint,
  editLogPoint,
  getCurrentLogPointPanelTypeAhead,
} from "../helpers/source-panel";

const url = "log_points_and_block_scope.html";

test(`logpoints-05: should auto-complete based on log point location`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await addLogpoint(page, { lineNumber: 5, url });
  await addLogpoint(page, { lineNumber: 9, url });
  await addLogpoint(page, { lineNumber: 14, url });

  // Verify different auto-complete options based on location
  await editLogPoint(page, { content: "array", lineNumber: 5, saveAfterEdit: false, url });
  let textContent = await getCurrentLogPointPanelTypeAhead(page).textContent();
  await expect(textContent).toContain("arrayGlobal");
  await expect(textContent).not.toContain("arrayBlockOne");
  await expect(textContent).not.toContain("arrayBlockTwo");

  await editLogPoint(page, { content: "array", lineNumber: 9, saveAfterEdit: false, url });
  textContent = await getCurrentLogPointPanelTypeAhead(page).textContent();
  await expect(textContent).toContain("arrayGlobal");
  await expect(textContent).toContain("arrayBlockOne");
  await expect(textContent).not.toContain("arrayBlockTwo");

  await editLogPoint(page, { content: "array", lineNumber: 14, saveAfterEdit: false, url });
  textContent = await getCurrentLogPointPanelTypeAhead(page).textContent();
  await expect(textContent).toContain("arrayGlobal");
  await expect(textContent).not.toContain("arrayBlockOne");
  await expect(textContent).toContain("arrayBlockTwo");
});

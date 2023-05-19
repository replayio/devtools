import { test } from "@playwright/test";

import { toggleProtocolMessages } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { addLogPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should gracefully handle invalid remote analysis", async ({ page }, testInfo) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, { content: "z", sourceId, lineNumber: 13 });

  const message = page.locator("[data-test-name=Message]").first();
  await takeScreenshot(page, testInfo, message, "log-point-invalid-remote-analysis-console");
});

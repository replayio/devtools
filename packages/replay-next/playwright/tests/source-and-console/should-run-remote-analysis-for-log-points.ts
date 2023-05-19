import { test } from "@playwright/test";

import { toggleExpandable } from "replay-next/playwright/tests/utils/inspector";

import { toggleProtocolMessages } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { addLogPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should run remote analysis for log points", async ({ page }, testInfo) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, { sourceId, lineNumber: 13, content: "printError" });

  const sourceRoot = page.locator("[data-test-id=SourcesRoot]");
  await takeScreenshot(page, testInfo, sourceRoot, "log-point-analysis-source");

  const messages = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, testInfo, messages, "log-point-analysis-console");

  const message = page.locator("[data-test-name=Message]").first();
  const keyValue = message.locator("[data-test-name=Expandable]");
  await toggleExpandable(page, {
    expanded: true,
    expandableLocator: keyValue,
  });
  await takeScreenshot(page, testInfo, message, "log-point-analysis-expanded-console");
});

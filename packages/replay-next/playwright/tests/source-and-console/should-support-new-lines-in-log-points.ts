import { test } from "@playwright/test";

import { toggleProtocolMessages, verifyConsoleMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { addLogPoint, editLogPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should support new lines in log points", async ({ page }, testInfo) => {
  await toggleProtocolMessages(page, false);

  await addLogPoint(page, { sourceId, lineNumber: 13, content: "initial" });

  const strings = ['"one\\ntwo"', "'one\\ntwo'", "`one\\ntwo`"];
  for (let index = 0; index < strings.length; index++) {
    const string = strings[index];
    await editLogPoint(page, { sourceId, lineNumber: 13, content: string });
    await verifyConsoleMessage(page, "two", "log-point", 1);
    const message = page.locator("[data-test-name=Message]").first();
    await takeScreenshot(page, testInfo, message, "log-point-with-new-lines");
  }
});

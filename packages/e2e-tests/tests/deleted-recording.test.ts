import test from "@playwright/test";

import examples from "../examples.json";
import { startTest } from "../helpers";
import { verifyErrorDialog } from "../helpers/errors";

test("deleted-recording: Show error message for deleted recording", async ({ page }) => {
  await startTest(page, examples["deleted-replay"].recording, "", undefined, undefined, false);

  await verifyErrorDialog(page, {
    expectedDetails: "This recording has been deleted.",
    expectedTitle: "Recording Deleted",
    expectedType: "expected",
  });
});

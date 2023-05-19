import { test } from "@playwright/test";

import {
  addLogPoint,
  goToNextHitPoint,
  goToPreviousHitPoint,
  verifyHitPointButtonsEnabled,
  verifyLogPointStep,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should update the current time when the next/previous log point buttons are clicked", async ({
  page,
}, testInfo) => {
  const lineNumber = 18;

  await addLogPoint(page, { lineNumber, sourceId });
  await verifyLogPointStep(page, "1/2", { lineNumber, sourceId });
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: false,
    nextEnabled: true,
  });

  await goToNextHitPoint(page, lineNumber);
  await verifyLogPointStep(page, "1/2", { lineNumber, sourceId });
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: false,
    nextEnabled: true,
  });

  await goToNextHitPoint(page, lineNumber);
  await verifyLogPointStep(page, "2/2", { lineNumber, sourceId });
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: true,
    nextEnabled: false,
  });

  await goToPreviousHitPoint(page, lineNumber);
  await verifyLogPointStep(page, "1/2", { lineNumber, sourceId });
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: false,
    nextEnabled: true,
  });
});

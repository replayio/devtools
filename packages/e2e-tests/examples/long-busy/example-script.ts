import type { Page, expect as expectType } from "@playwright/test";

const NUM_CLICKS = 24;
const CLICK_INTERVAL_MS = 5_000;
// Held down for a second, so its click handler runs well after the mousedown event
const HELD_CLICK_NUMBER = 13;

function delay(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export default async function testFunction(page: Page, expect: typeof expectType) {
  const incrementButton = page.locator("#increment");
  await incrementButton.waitFor();

  for (let clickNumber = 1; clickNumber <= NUM_CLICKS; clickNumber++) {
    await delay(CLICK_INTERVAL_MS);

    if (clickNumber === HELD_CLICK_NUMBER) {
      const box = await incrementButton.boundingBox();
      expect(box).toBeTruthy();
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await page.mouse.down();
      await page.evaluate(() => console.log("Holding increment button"));
      await delay(1_000);
      await page.mouse.up();
    } else {
      await incrementButton.click();
    }

    await expect(page.locator("#summary")).toContainText(`clicks: ${clickNumber}`);
  }

  await delay(CLICK_INTERVAL_MS);

  const finishedPromise = page.waitForEvent("console", {
    predicate: message => message.text() === "ExampleFinished",
  });
  await page.locator("#finish").click();
  await finishedPromise;

  // add a little delay to ensure that the last click was added
  // to the recording, see [FE-2286] and [RUN-3258]
  await delay(500);
}

import { Page } from "@playwright/test";

export function getScreenshot(page: Page) {
  return page.locator("canvas#graphics");
}

export async function clickScreenshot(page: Page, x: number, y: number) {
  const screenshot = getScreenshot(page);
  const scale = await getScreenshotScale(page);
  const position = {
    x: x * scale,
    y: y * scale,
  };
  await screenshot.click({ position, force: true });
}

export async function getScreenshotScale(page: Page) {
  // HACK Our preview canvas is scaled down depending on position and original app
  // page size. We'll need to alter where we click on page by the same scale,
  // in order to correctly click on the intended elements from original x/y coords.
  // Grab the `transform` style from the canvas node and parse out the scale factor.
  const screenshot = getScreenshot(page);
  const canvasTransformString = await screenshot.evaluate(node => {
    return node.style.transform;
  });
  // simpler to rewrite "scale(0.123)" by replacing than regexing right now
  const scaleString = canvasTransformString.replace("scale(", "").replace(")", "");

  return Number(scaleString);
}

export async function hoverScreenshot(page: Page, x: number, y: number) {
  const screenshot = getScreenshot(page);
  const scale = await getScreenshotScale(page);
  const position = {
    x: x * scale,
    y: y * scale,
  };
  await screenshot.hover({ position, force: true });
}

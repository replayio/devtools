import { Page } from "@playwright/test";
import chalk from "chalk";

import { debugPrint } from "./utils";

export async function convertCoordinatesForScreenshot(
  page: Page,
  xPercentage: number,
  yPercentage: number
) {
  const graphicsElement = getGraphicsElement(page);

  const { width, height } = (await graphicsElement.boundingBox())!;

  const x = xPercentage * width;
  const y = yPercentage * height;

  await debugPrint(
    page,
    `Scaling coordinates ${chalk.bold(xPercentage.toFixed(2))}%, ${chalk.bold(
      yPercentage.toFixed(2)
    )}% to ${chalk.bold(Math.round(x))}px, ${chalk.bold(Math.round(y))}px of ${chalk.bold(
      Math.round(width)
    )}px x ${chalk.bold(Math.round(height))}px`,
    "convertCoordinatesForScreenshot"
  );

  return { x, y };
}

export function getGraphicsElement(page: Page) {
  return page.locator("#graphics");
}

export async function clickScreenshot(page: Page, xPercentage: number, yPercentage: number) {
  await debugPrint(
    page,
    `Click screenshot coordinates ${chalk.bold(xPercentage.toFixed(2))}%, ${chalk.bold(
      yPercentage.toFixed(2)
    )}%`,
    "clickScreenshot"
  );

  const screenshot = getGraphicsElement(page);
  const position = await convertCoordinatesForScreenshot(page, xPercentage, yPercentage);
  await screenshot.click({ position, force: true });
}

export async function getGraphicsElementScale(page: Page) {
  const element = getGraphicsElement(page);
  const scaleString = await element.getAttribute("data-scale");
  return Number(scaleString);
}

export async function hoverScreenshot(page: Page, xPercentage: number, yPercentage: number) {
  await debugPrint(
    page,
    `Hover over screenshot coordinates ${chalk.bold(xPercentage.toFixed(2))}%, ${chalk.bold(
      yPercentage.toFixed(2)
    )}%`,
    "hoverScreenshot"
  );

  const screenshot = getGraphicsElement(page);
  const position = await convertCoordinatesForScreenshot(page, xPercentage, yPercentage);
  await screenshot.hover({ position, force: true });
}

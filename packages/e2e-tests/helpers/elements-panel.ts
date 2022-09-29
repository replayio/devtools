import { waitFor } from "@playwright-testing-library/test";
import { expect, Locator } from "@playwright/test";
import chalk from "chalk";

import { Screen } from "./types";
import { debugPrint } from "./utils";

export async function activateInspectorTool(screen: Screen): Promise<void> {
  await screen.queryByTestId("PanelButton-inspector").click();
}

// TODO [FE-626] Rewrite this helper to reduce complexity.
export async function checkComputedStyle(
  screen: Screen,
  style: string,
  value: string,
  expectedSelectors: any = undefined
): Promise<void> {
  await openComputedPropertiesTab(screen);
  await waitFor(async () => {
    const result = await screen.evaluate(
      ({ style, value, matchedSelectors }) => {
        function getMatchedSelectors(property: string) {
          const propertyNodes = document.querySelectorAll<HTMLElement>(".computed-property-view");

          const propertyNode = [...propertyNodes].find(
            node =>
              node!.querySelector(".computed-property-name")!.childNodes[0].textContent === property
          );

          if (!propertyNode) {
            return [];
          }

          const expander: HTMLElement | null = propertyNode.querySelector(".computed-expander");
          if (!expander!.matches(".open")) {
            expander!.click();
          }

          const selectorNodes = (
            propertyNode.nextSibling as HTMLElement
          ).querySelectorAll<HTMLElement>(".rule-text");
          return [...selectorNodes].map(selectorNode => {
            const selector = (selectorNode.children[0] as HTMLElement).innerText;
            const value = (selectorNode.children[1] as HTMLElement).innerText;
            const label = (selectorNode.previousSibling as HTMLElement).innerText;
            const previousChild = (selectorNode.previousSibling as HTMLElement).children[0];
            const url = (previousChild as HTMLElement).title;
            const overridden = (selectorNode.parentNode as HTMLElement).classList.contains(
              "computed-overridden"
            );
            return { selector, value, label, url, overridden };
          });
        }

        const names = document.querySelectorAll<HTMLElement>(".computed-property-name");
        const propertyName = [...names].find(n => n!.textContent!.includes(style));
        if (!propertyName) {
          return false;
        }
        const container = propertyName.closest(".computed-property-view");
        if (!container) {
          return false;
        }
        const propertyValue: HTMLElement | null = container.querySelector(
          ".computed-property-value"
        );
        const expectedSelectorsJSON = matchedSelectors
          ? JSON.stringify(matchedSelectors)
          : undefined;
        const selectorsJSON = matchedSelectors
          ? JSON.stringify(getMatchedSelectors(style))
          : undefined;
        return (
          propertyValue!.textContent!.includes(value) && selectorsJSON === expectedSelectorsJSON
        );
      },
      { style, value, matchedSelectors: expectedSelectors }
    );
    expect(result).toBe(true);
  });
}

export function getElementsPanelSelection(screen: Screen): Locator {
  debugPrint(`Getting Elements panel selection`, "getElementsPanelSelection");

  const elements = screen.locator("#inspector-main-content");
  const selectedLine = elements.locator(".tag-line.selected");

  return selectedLine;
}

export function getElementsRowWithText(screen: Screen, text: string): Locator {
  const escapedText = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return screen.locator(`#markup-box .editor:has-text("${escapedText}")`);
}

// This helper function uses the Elements inspector to click on a part of the preview Canvas.
// Rather than using hard-coded pixel numbers, the x and y positions passed in should be percentages (0-1)
// which will be converted to coordinates based on the size of the preview Canvas.
export async function inspectCanvasCoordinates(
  screen: Screen,
  xPercentage: number,
  yPercentage: number
): Promise<void> {
  if (xPercentage < 0 || xPercentage > 1 || yPercentage < 0 || yPercentage > 1) {
    throw Error(
      `Invalid coordinate percentages passed (${xPercentage}, ${yPercentage}); must be between 0-1.`
    );
  }

  debugPrint(`Inspecting preview Canvas`, "inspectCanvasCoordinates");

  await activateInspectorTool(screen);

  const pickerButton = screen.queryByTitle("Select an element in the video to inspect it")!;
  await pickerButton.click();

  const canvas = screen.locator("#graphics");
  const height = await canvas.getAttribute("height");
  const width = await canvas.getAttribute("width");
  const x = xPercentage * (width as any as number);
  const y = yPercentage * (height as any as number);

  debugPrint(
    `Clicking Canvas coordinates ${chalk.bold(x)}px (${Math.round(
      xPercentage * 100
    )}%), ${chalk.bold(y)}px (${Math.round(yPercentage * 100)}%)`,
    "inspectCanvasCoordinates"
  );

  canvas.click({ position: { x, y } });
}

export async function openComputedPropertiesTab(screen: Screen): Promise<void> {
  const locator = screen.locator("#computedview-tab");
  await locator.waitFor();
  await locator.click();
}

export async function searchElementsPanel(screen: Screen, searchText: string): Promise<void> {
  debugPrint(`Searching Elements for text ${chalk.bold(`"${searchText}"`)}`, "searchElementsPanel");

  await activateInspectorTool(screen);

  const input = screen.queryByPlaceholderText("Search HTML")!;
  await input.focus();
  await input.type(searchText);
  await input.press("Enter");
}

export async function selectElementsRowWithText(screen: Screen, text: string): Promise<void> {
  const node = getElementsRowWithText(screen, text);
  await node.waitFor();
  await node.click();
}

export async function selectNextElementsPanelSearchResult(screen: Screen): Promise<void> {
  const searchBox = screen.getByPlaceholderText("Search HTML");
  await searchBox.press("Enter");
}

// TODO [FE-626] Make the intent of this function clearer: should it toggle open or closed?
export async function toggleMarkupNode(locator: Locator): Promise<void> {
  await locator.evaluate(node => {
    const expander = node.parentElement?.querySelector(".expander");
    if (expander) {
      (expander as HTMLElement).click();
    }
  });
}

export function waitForSelectedElementsRow(screen: Screen, text: string): Promise<void> {
  const escapedText = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return screen.locator(`#markup-box .selected > .editor:has-text("${escapedText}")`).waitFor();
}

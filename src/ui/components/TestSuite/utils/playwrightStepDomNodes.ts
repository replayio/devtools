// This is a magic variable in scope with the current execution point for this eval step.
// Ref: BAC-4285, backend PR #9104
declare const __REPLAY_CURRENT_EVALUATION_POINT__: string;

declare const PLAYWRIGHT_INJECTED_SCRIPT: {
  parseSelector: (selector: string) => ParsedSelector;
  querySelectorAll: (parsedSelector: ParsedSelector, parentNode: HTMLElement) => HTMLElement[];
  document: HTMLElement;
};

// copied from Playwright's `selectorParser.ts`
export type ParsedSelectorPart = {
  name: string;
  // Also technically a couple other types, but irrelevant for our case.
  // We just want a declaration of the overall `ParsedSelector` structure.
  body: string;
  source: string;
};

export type ParsedSelector = {
  parts: ParsedSelectorPart[];
  capture?: number;
};

export function getPlaywrightTestStepDomNodes(pointsToLocatorStrings: Record<string, string>) {
  const currentExecutionPoint = __REPLAY_CURRENT_EVALUATION_POINT__;

  // Look up the locator string for this execution point
  const locatorString = pointsToLocatorStrings[currentExecutionPoint];

  // Playwright parses the locator string into descriptive objects
  const parsedSelector = PLAYWRIGHT_INJECTED_SCRIPT.parseSelector(locatorString);

  let foundElements: HTMLElement[] = [];

  // Look for the actual target elements
  try {
    foundElements =
      PLAYWRIGHT_INJECTED_SCRIPT.querySelectorAll(
        parsedSelector,
        PLAYWRIGHT_INJECTED_SCRIPT.document
      ) ?? [];
  } catch (err) {}

  // It may be useful for test debugging purposes to see _all_ of the elements retrieved
  // for _each_ segment of the locator string. Now that this is already split up,
  // we can do that by slicing the selector parts and querying for each subset.
  const iterativeSelectors = parsedSelector.parts.map((part, index) => {
    return {
      parts: parsedSelector.parts.slice(0, index + 1),
      capture: parsedSelector.capture,
    };
  });

  const allSelectedElements = iterativeSelectors.map(selector => {
    let elements: HTMLElement[] = [];
    try {
      elements = PLAYWRIGHT_INJECTED_SCRIPT.querySelectorAll(
        selector,
        PLAYWRIGHT_INJECTED_SCRIPT.document
      );
    } catch (err) {}

    return elements;
  });

  // Now we deal with our runEvaluation object preview limits again.
  // To get the DOM node previews back as fast as possible, we'll inline the primary DOM
  // nodes directly into this result array.
  // We'll include the rest of the data for use in later dev work.
  const result = [
    foundElements.length,
    ...foundElements,
    JSON.stringify(parsedSelector),
    // all parsed selectors
    JSON.stringify(iterativeSelectors),
    {
      foundElements,
      allSelectedElements,
    },
  ];

  return result;
}

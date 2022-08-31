// Harness for use by automated tests. Adapted from various test devtools
// test harnesses.

import { getDevicePixelRatio } from "protocol/graphics";
// eslint-disable-next-line no-restricted-imports
import { sendMessage } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { assert } from "protocol/utils";
import mapValues from "lodash/mapValues";
import isEqual from "lodash/isEqual";

type $FixTypeLater = any;

const dbg = window.app;

export function waitForTime(ms: number, waitingFor?: string) {
  console.log(`waiting ${ms}ms for ${waitingFor}`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Assume that these always exist
const dbgSelectors = window.app.selectors!;
const dbgActions = window.app.actions!;

function isLongTimeout() {
  return new URL(window.location.href).searchParams.get("longTimeout");
}

function defaultWaitTimeout() {
  return 1000 * (isLongTimeout() ? 120 : 10);
}

export async function waitUntil<T>(
  fn: () => T,
  options?: { timeout?: number; waitingFor?: string }
) {
  const { timeout, waitingFor } = {
    timeout: defaultWaitTimeout(),
    waitingFor: "unknown",
    ...options,
  };
  const start = Date.now();
  while (true) {
    const rv = fn();
    if (rv) {
      return rv;
    }
    const elapsed = Date.now() - start;
    if (elapsed >= timeout) {
      break;
    }
    if (elapsed < 1000) {
      await waitForTime(50, waitingFor);
    } else if (elapsed < 5000) {
      await waitForTime(200, waitingFor);
    } else {
      await waitForTime(1000, waitingFor);
    }
  }
  throw new Error(`waitUntil() timed out waiting for ${waitingFor}`);
}

export function start() {
  dbgActions.setViewMode("dev");
  return waitUntil(
    () =>
      isFullyLoaded() &&
      dbgSelectors.getViewMode() == "dev" &&
      document.querySelector("[data-test-id=ConsoleRoot]"),
    {
      timeout: 1000 * 120,
      waitingFor: "the page to load",
    }
  );
}

function finish() {
  console.log("TestFinished", { success: true });
  localStorage.clear();
}

function isFullyLoaded() {
  const loadedRegions = dbgSelectors.getLoadedRegions();

  return (
    ThreadFront.hasAllSources &&
    loadedRegions &&
    loadedRegions.loading.length > 0 &&
    loadedRegions.loaded.length > 0 &&
    loadedRegions.loading[0].end.point === loadedRegions.loaded[0].end.point
  );
}

async function clickElement(selector: string) {
  const element: HTMLElement | null = await waitUntil(() => document.querySelector(selector), {
    waitingFor: `${selector} to appear`,
  });
  if (!element) {
    console.log(`Could not find element with selector ${selector}`);
    return;
  }
  return element.click();
}

function selectConsole() {
  return clickElement('[data-test-id="PanelButton-console"]');
}

async function selectInspector() {
  await clickElement('[data-test-id="PanelButton-inspector"]');

  await waitUntil(() => document.querySelector(".inspector ul.children"), {
    waitingFor: "inspector to initialize",
  });
}

const selectReactDevTools = async () =>
  clickElement('[data-test-id="PanelButton-react-components"]');
const getContext = () => dbgSelectors.getContext();
const getThreadContext = () => dbgSelectors.getThreadContext();

function findSource(url: string) {
  if (typeof url !== "string") {
    // Support passing in a source object itelf all APIs that use this function
    // support both styles
    return url;
  }

  const sourcesByUrl = dbgSelectors.getSourcesToDisplayByUrl();
  for (const sourceUrl in sourcesByUrl) {
    if (sourceUrl.includes(url)) {
      return sourcesByUrl[sourceUrl];
    }
  }
}

function waitForSource(url: string) {
  return waitUntil(() => findSource(url), { waitingFor: `source: ${url} to be present` });
}

function countSources(url: string) {
  const sources = dbgSelectors.getAllSourceDetails();
  return sources.filter(s => (s.url || "").includes(url)).length;
}

async function selectSource(url: string) {
  const source = await waitForSource(url);
  await dbgActions.selectLocation(getContext(), { sourceId: source!.id }, true);
  return waitForSelectedSource(url);
}

async function addLogpoint(url: string, line: number) {
  const lpCount = dbgSelectors.getLogpointCount();

  await selectSource(url);
  await dbgActions.addLogpoint(getContext(), line);

  await waitUntil(
    () => {
      return dbgSelectors.getLogpointCount() == lpCount + 1;
    },
    { waitingFor: "logpoint to be set" }
  );
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

async function addBreakpoint(url: string, line: number, column: number, options?: $FixTypeLater) {
  const bpCount = dbgSelectors.getBreakpointCount();

  if (options) {
    const source = await waitForSource(url);
    const sourceId = source!.id;
    await dbgActions.addBreakpoint(
      getContext(),
      { sourceId, line, column, sourceUrl: source!.url! },
      options
    );
  } else {
    // If there are no options, use the default log value for adding new breakpoints,
    // as if the user clicked on the line.
    assert(!column, "column should not bet set if there are no options");
    await selectSource(url);
    await dbgActions.addBreakpointAtLine(getContext(), line);
  }

  await waitUntil(
    () => {
      return dbgSelectors.getBreakpointCount() == bpCount + 1;
    },
    { waitingFor: "breakpoint to be set" }
  );
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

async function setBreakpointOptions(
  url: string,
  line: number,
  column: number,
  options?: $FixTypeLater
) {
  const source = await waitForSource(url);
  const sourceId = source!.id;
  column = column || getFirstBreakpointColumn(line, sourceId);
  await dbgActions.addBreakpoint(
    getContext(),
    { sourceId, line, column, sourceUrl: source!.url! },
    options
  );
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

async function disableBreakpoint(url: string, line: number, column: number) {
  const source = await waitForSource(url);
  const sourceId = source!.id;
  column = column || getFirstBreakpointColumn(line, sourceId);
  const location = { sourceId, sourceUrl: source!.url, line, column };
  const bp = dbgSelectors.getBreakpointForLocation(location);
  await dbgActions.disableBreakpoint(getContext(), bp!);
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

function getFirstBreakpointColumn(line: number, sourceId: string) {
  const position = dbgSelectors.getFirstBreakpointPosition({ line, sourceId });
  return position!.column;
}

async function removeAllBreakpoints() {
  await dbgActions.removeAllBreakpoints(getContext());
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

async function unloadRegion(begin: number, end: number) {
  await sendMessage("Session.unloadRegion", { region: { begin, end } }, ThreadFront.sessionId!);
}
async function loadRegion(begin: number, end: number) {
  await sendMessage("Session.loadRegion", { region: { begin, end } }, ThreadFront.sessionId!);
}

function isPaused() {
  return dbgSelectors.getIsPaused();
}

async function waitForLoadedScopes() {
  await waitUntil(
    () => document.querySelector("[data-test-name=ScopesList] [data-test-name=Expandable]"),
    {
      waitingFor: "scopes to be loaded",
    }
  );
}

function waitForSelectedSource(url?: string) {
  const { getSelectedSourceWithContent, getBreakableLinesForSource } = dbgSelectors;

  return waitUntil(
    () => {
      const source = getSelectedSourceWithContent()! || {};
      if (!source.value) {
        return false;
      }

      if (!url) {
        return true;
      }

      const newSource = findSource(url)!;
      if (newSource.id != source.id) {
        return false;
      }

      // The hasSymbols check is disabled. Sometimes the parser worker fails for
      // unclear reasons. See https://github.com/RecordReplay/devtools/issues/433
      // return hasSymbols(source) && getBreakableLines(source.id);
      return getBreakableLinesForSource(source.id);
    },
    { waitingFor: `source ${url} to be selected` }
  );
}

async function waitForPaused(url?: string) {
  const { getFrames, getSelectedScope } = dbgSelectors;
  // Make sure that the debug primary panel is selected so that the test can
  // interact with the pause navigation and info.
  window.app.store.dispatch({ type: "set_selected_primary_panel", panel: "debugger" });
  await waitUntil(() => isPaused() && !!getSelectedScope(), { waitingFor: "execution to pause" });
  await waitUntil(() => getFrames(), { waitingFor: "frames to populate" });
  await waitForLoadedScopes();
  await waitForSelectedSource(url);
}

async function waitForPausedNoSource() {
  // Make sure that the debug primary panel is selected so that the test can
  // interact with the pause navigation and info.
  window.app.store.dispatch({ type: "set_selected_primary_panel", panel: "debugger" });

  await waitUntil(() => isPaused(), { waitingFor: "execution to pause" });
}

function getVisibleSelectedFrameLine() {
  const frame = dbgSelectors.getVisibleSelectedFrame()!;
  return frame && frame.location.line;
}

async function waitForPausedLine(line: number) {
  await waitUntil(() => line == getVisibleSelectedFrameLine(), {
    waitingFor: `line ${line} to paused`,
  });
}

function resumeThenPauseAtLineFunctionFactory(
  method: "rewind" | "resume" | "reverseStepOver" | "stepOver" | "stepIn" | "stepOut"
) {
  return async function (line: number) {
    await dbgActions[method](getThreadContext());
    if (line !== undefined) {
      await waitForPaused();
    } else {
      await waitForPausedNoSource();
    }
    await waitForPausedLine(line);
  };
}

// Define various methods that resume a thread in a specific way and ensure it
// pauses at a specified line.
const rewindToLine = resumeThenPauseAtLineFunctionFactory("rewind");
const resumeToLine = resumeThenPauseAtLineFunctionFactory("resume");
const reverseStepOverToLine = resumeThenPauseAtLineFunctionFactory("reverseStepOver");
const stepOverToLine = resumeThenPauseAtLineFunctionFactory("stepOver");
const stepInToLine = resumeThenPauseAtLineFunctionFactory("stepIn");
const stepOutToLine = resumeThenPauseAtLineFunctionFactory("stepOut");

function resumeAndPauseFunctionFactory(
  method: "reverseStepOver" | "stepOver" | "stepIn" | "stepOut"
) {
  return async function () {
    await dbgActions[method](getThreadContext());
    await waitForPausedNoSource();
  };
}

const stepOverAndPause = resumeAndPauseFunctionFactory("stepOver");

async function checkEvaluateInTopFrame(text: string, expected: string) {
  selectConsole();

  await executeInConsole(text);

  await waitUntil(
    () => {
      const messages = document.querySelectorAll<HTMLElement>(
        '[data-test-name="Message"][data-test-message-type="terminal-expression"] [data-test-name="TerminalExpression-Result"]'
      );
      return Array.from(messages).find((node: HTMLElement) => node.innerText === expected);
    },
    { waitingFor: `message with text "${expected}"` }
  );

  await clearConsoleEvaluations();
}

async function clearConsoleEvaluations() {
  const clearButton = await waitUntil(
    () => {
      const button: HTMLButtonElement | null = document.querySelector(
        '[data-test-id="ClearConsoleEvaluationsButton"]'
      );
      if (button && !button.disabled) {
        return button;
      }
    },
    { waitingFor: "clear console evaluations button to be enabled" }
  );
  clearButton!.click();
}

async function waitForScopeValue(name: string, value: string) {
  const expected = value !== undefined ? `${name}: ${value}` : name;
  return waitUntil(
    () => {
      const nodes = document.querySelectorAll<HTMLElement>(
        "[data-test-name=ScopesList] [data-test-name=Expandable]"
      );
      return Array.from(nodes).some(node => node.innerText.includes(expected));
    },
    { waitingFor: `scope "${value}" to be present` }
  );
}

function findMessages(text: string) {
  const messages = document.querySelectorAll<HTMLElement>(`[data-test-name=Message]`);
  return Array.from(messages).filter(message => message.innerText.includes(text));
}

async function getAllMessages() {
  await waitUntil(() => document.querySelector(`[data-test-name=Message]`), {
    waitingFor: `Messages to load`,
  });

  const messageNodes = document.querySelectorAll(
    `[data-test-name=Messages] [data-test-name=Message]`
  );

  return Array.from(messageNodes);
}

function checkAllMessages(expected: string) {
  return waitUntil(
    () => {
      const messageNodes = document.querySelectorAll(
        `[data-test-name=Messages] [data-test-name=Message]`
      );

      const actual = [];
      for (const node of messageNodes) {
        const dataType = node.getAttribute("data-test-message-type");

        let type: string | undefined = "unknown";
        switch (dataType) {
          case "console-error":
          case "console-log":
          case "console-warning":
            type = "console-api";
            break;
          case "event":
            break;
          case "exception":
            type = "error";
            break;
          case "log-point":
            type = "logPoint";
            break;
          case "terminal-expression":
            // Contains both "command" and "result" types
            type = "result";
            break;
        }

        if (type) {
          actual.push({
            type,
            content: (node as HTMLElement).innerText,
          });
        }
      }

      return isEqual(actual, expected);
    },
    { waitingFor: `messages to match ${JSON.stringify(expected)}` }
  );
}

function waitForMessage(text: string) {
  return waitUntil(
    () => {
      const messages = findMessages(text);
      return messages?.[0];
    },
    { waitingFor: `a message: ${text}` }
  );
}

async function warpToMessage(text: string) {
  const msg = await waitForMessage(text);

  dispatchMouseEvent(msg, "mouseover");

  const warpButton: HTMLButtonElement | null = await waitUntil(() =>
    msg.querySelector("[data-test-id=ConsoleMessageHoverButton]")
  );

  if (warpButton === null) {
    throw Error("Could not find fast-forward/rewind button");
  }

  warpButton.click();

  await new Promise(resolve => setTimeout(resolve, 1000));

  await waitForPaused();
}

function waitForMessageCount(text: string, count: number, timeoutFactor = 1) {
  return waitUntil(
    () => {
      const messages = findMessages(text);
      return messages.length == count ? messages : null;
    },
    {
      waitingFor: `${count} messages with text: "${text}"`,
      timeout: defaultWaitTimeout() * timeoutFactor,
    }
  );
}

function checkJumpIcon(msg: HTMLElement) {
  const jumpIcon = msg.querySelector('[date-test-name="JumpToDefinitionButton"]');
  assert(jumpIcon, "no jumpIcon");
}

async function findMessageExpandableObjectInspector(msg: HTMLElement, text: string) {
  return waitUntil(
    () => {
      const nodes = msg.querySelectorAll<HTMLElement>(
        '[data-test-name="Message"] [data-test-name="Expandable"] [role="button"]'
      );
      return Array.from(nodes).find(node => node.innerText.includes(text));
    },
    { waitingFor: `findMessageExpandableObjectInspector(${msg}) with text "${text}"` }
  );
}

async function toggleObjectInspectorNode(node: HTMLElement, expand: boolean = true) {
  const isExpanded = node.getAttribute("data-test-state") === "open";
  if (isExpanded !== expand) {
    const button = node.querySelector<HTMLDivElement>("[data-test-name=ExpandablePreview]")!;
    button.click();
  }
}

async function checkPausedMessage(text: string) {
  await waitUntil(
    () => {
      const messagesList = document.querySelector('[data-test-name="Messages"]')!;
      const messages = findMessages(text);
      if (messages.length !== 1) {
        return false;
      }
      const index = Array.from(messagesList.children).indexOf(messages[0]);
      const previousChild = messagesList.children[index - 1];
      const result = previousChild.getAttribute("data-test-id") === "Console-CurrentTimeIndicator";
      return result;
    },
    {
      waitingFor: `Wait until paused at "${text}"`,
    }
  );
}

function findScopeNode(text: string) {
  return waitUntil(
    () => {
      const nodes = document.querySelectorAll<HTMLElement>(
        "[data-test-name=ScopesList] [data-test-name=Expandable]"
      );
      return Array.from(nodes).find(node => node.innerText.includes(text));
    },
    { waitingFor: `scope node "${text}" to be present` }
  );
}

async function toggleScopeNode(text: string) {
  const scopeBlock = await findScopeNode("Block");
  await toggleObjectInspectorNode(scopeBlock!);
  const node = await findScopeNode(text);
  return toggleObjectInspectorNode(node!);
}

async function writeInConsole(value: string) {
  window.jsterm.setValue(value);
  await waitUntil(() => window.jsterm.editor.getValue() === value);
  // workaround for #6774
  // TODO [hbenl] remove this workaround once JSTerm is fixed (#6778)
  await waitForTime(100);
}

async function executeInConsole(value: string) {
  await writeInConsole(value);
  window.jsterm.execute();
  await new Promise(resolve => setTimeout(resolve, 1));
}

function getAutocompleteMatches() {
  return [...document.querySelectorAll<HTMLElement>(".autocomplete-matches button")].map(
    btn => btn.innerText
  );
}

function checkAutocompleteMatches(expected: string[]) {
  const expectedJSON = JSON.stringify([...expected].sort());
  return waitUntil(
    () => {
      const actualJSON = JSON.stringify(getAutocompleteMatches().sort());
      return actualJSON === expectedJSON;
    },
    {
      waitingFor: `autocomplete matches to equal ${expectedJSON}`,
    }
  );
}

function waitForFrameTimeline(width: string) {
  return waitUntil(
    () => {
      const elem: HTMLElement | null = document.querySelector(".frame-timeline-progress");
      return elem?.style.width == width;
    },
    { waitingFor: `timeline to be ${width} wide` }
  );
}

async function checkFrames(count: number) {
  return waitUntil(
    () => {
      const frames = dbgSelectors.getFrames()!;
      return frames.length == count;
    },
    { waitingFor: `${count} frames to be present` }
  );
}

async function selectFrame(index: number) {
  const frames = dbgSelectors.getFrames()!;
  await dbgActions.selectFrame(getThreadContext(), frames[index]);
}

// HACKY way of updating an <input> and dispatching events that React will pick up on.
// We should really be using Playwright and page.fill() for this purpose.
function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(input, "value")!.set!;
  const prototype = Object.getPrototypeOf(input);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")!.set!;
  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(input, value);
  } else {
    valueSetter.call(input, value);
  }
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function addEventListenerLogpoints(logpoints: string[]) {
  const filterInput = await waitUntil(
    () => document.querySelector<HTMLInputElement>('[data-test-id="EventTypeFilterInput"]'),
    {
      waitingFor: "EventTypeFilterInput to be present",
    }
  );

  for (let i = 0; i < logpoints.length; i++) {
    const logpoint = logpoints[i];

    setInputValue(filterInput!, logpoint);

    const toggle = await waitUntil(
      () => document.querySelector<HTMLElement>('[data-test-name="EventTypeToggle"]'),
      {
        waitingFor: "EventTypeToggle to be present",
      }
    );
    toggle!.click();
  }
}

async function toggleExceptionLogging(checked: boolean) {
  const input = await waitUntil(
    () =>
      document.querySelector<HTMLInputElement>('[data-test-id="FilterToggle-exceptions"] input'),
    {
      waitingFor: "Exceptions toggle to be present",
    }
  );

  if (input!.checked !== checked) {
    input!.click();
  }
}

async function toggleFilter(id: string, checked: boolean) {
  const input = await waitUntil(
    () => document.querySelector<HTMLInputElement>(`[data-test-id="FilterToggle-${id}"] input`),
    {
      waitingFor: "Exceptions toggle to be present",
    }
  );

  if (input!.checked !== checked) {
    input!.click();
  }
}

async function toggleMappedSources() {
  return clickElement(".mapped-source button");
}

async function findMarkupNode(text: string) {
  return waitUntil(
    () => {
      const nodes = document.querySelectorAll<HTMLElement>("#markup-box .editor");
      return [...nodes].find(n => n.innerText.includes(text));
    },
    { waitingFor: `markup node with ${text} to be present` }
  );
}

async function toggleMarkupNode(node: HTMLElement) {
  const parent = node.closest(".expandable")!;
  const expander: HTMLElement | null = parent.querySelector(".expander");
  expander!.click();
}

async function searchMarkup(text: string) {
  const box = document.getElementById("inspector-searchbox") as HTMLInputElement;
  box.dispatchEvent(new FocusEvent("focus"));
  if (text !== undefined) {
    // Undefined is used to continue the previous search.
    box.value = text;
  }
  box.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
}

async function waitForSelectedMarkupNode(text: string) {
  return waitUntil(
    () => {
      const node: HTMLElement | null = document.querySelector(".theme-selected");
      if (!node) {
        return false;
      }
      const editor: HTMLElement | null = node.parentNode!.querySelector(".editor");
      return editor!.innerText.includes(text);
    },
    { waitingFor: `waitForSelectedMarkupNode(${text}) ` }
  );
}

function boundsCenter(bounds: DOMRect) {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2,
  };
}

async function getMarkupCanvasCoordinate(text: string, iframes: string[] = []) {
  let x = 0,
    y = 0;
  for (const iframeText of iframes) {
    const node = (await ThreadFront.searchDOM(iframeText))![0];
    const nodeRect = await node.getBoundingClientRect();
    const { left, top } = nodeRect!;
    x += left;
    y += top;
  }
  const node = (await ThreadFront.searchDOM(text))![0];
  const boundingRect = await node.getBoundingClientRect();
  const center = boundsCenter(boundingRect!);
  x += center.x;
  y += center.y;
  return { x, y };
}

async function pickNode(x: number, y: number) {
  window.gNodePicker.clickNodePickerButton();
  window.gNodePicker.nodePickerMouseClickInCanvas({ x, y });
}

async function selectMarkupNode(node: HTMLElement) {
  node.click();
  // the rules view updates asynchronously, so we wait one tick
  await new Promise(resolve => setTimeout(resolve, 0));
}

async function checkComputedStyle(style: string, value: string, matchedSelectors: any = undefined) {
  await clickElement("#computedview-tab");
  const matchedSelectorsJSON = matchedSelectors ? JSON.stringify(matchedSelectors) : undefined;
  await waitUntil(
    () => {
      const names = document.querySelectorAll<HTMLElement>(".computed-property-name");
      const propertyName = [...names].find(n => n!.textContent!.includes(style));
      if (!propertyName) {
        return false;
      }
      const container = propertyName.closest(".computed-property-view");
      if (!container) {
        return false;
      }
      const propertyValue: HTMLElement | null = container.querySelector(".computed-property-value");
      const selectors = matchedSelectors ? JSON.stringify(getMatchedSelectors(style)) : undefined;
      return propertyValue!.textContent!.includes(value) && selectors === matchedSelectorsJSON;
    },
    { waitingFor: `computedStyle, ${style} to match ${value}` }
  );
}

function getMatchedSelectors(property: string) {
  const propertyNodes = document.querySelectorAll<HTMLElement>(".computed-property-view");

  const propertyNode = [...propertyNodes].find(
    node => node!.querySelector(".computed-property-name")!.childNodes[0].textContent === property
  );

  if (!propertyNode) {
    return [];
  }

  const expander: HTMLElement | null = propertyNode.querySelector(".computed-expander");
  if (!expander!.matches(".open")) {
    expander!.click();
  }

  assert(
    (propertyNode.nextSibling as HTMLElement).matches(".computed-property-content"),
    "next sibling must have computed-property-content class"
  );

  const selectorNodes = (propertyNode.nextSibling as HTMLElement).querySelectorAll<HTMLElement>(
    ".rule-text"
  );
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

function setLonghandsExpanded(expanded: boolean) {
  document.querySelectorAll<HTMLElement>(".ruleview-expander").forEach(expander => {
    if (expander!.style.display !== "none" && expander!.classList.contains("open") !== expanded) {
      expander!.click();
    }
  });
}

function getAppliedRulesJSON() {
  const rules = document.querySelectorAll<HTMLElement>(".ruleview-rule");
  return [...rules].map(rule => {
    const selector = rule
      .querySelector<HTMLElement>(".ruleview-selectorcontainer")!
      .innerText.trim();
    const source = rule.querySelector<HTMLElement>(".ruleview-rule-source")!.innerText.trim();
    const properties = [...rule.querySelectorAll<HTMLElement>(".ruleview-propertycontainer")].map(
      prop => {
        let longhandProps;
        if (prop.nextSibling) {
          longhandProps = [
            ...(prop.nextSibling as HTMLElement).querySelectorAll<HTMLElement>("li"),
          ].map(longhand => ({
            text: longhand.innerText,
            overridden: longhand.classList.contains("ruleview-overridden"),
          }));
        }
        return {
          text: prop.innerText.trim(),
          overridden: (prop.parentNode as HTMLElement).className.includes("overridden"),
          longhandProps,
        };
      }
    );
    return { selector, source, properties };
  });
}

async function checkAppliedRules(expected: any) {
  await ensurePseudoElementRulesExpanded();
  await waitUntil(
    () => {
      const json = getAppliedRulesJSON();
      return JSON.stringify(json) == JSON.stringify(expected);
    },
    {
      waitingFor: `applied rules to be: ${JSON.stringify(expected)}, found: ${JSON.stringify(
        getAppliedRulesJSON()
      )}`,
    }
  );
}

async function ensurePseudoElementRulesExpanded() {
  const header = document.getElementById("rules-section-pseudoelement-header");
  if (header && header.getAttribute("aria-expanded") != "true") {
    header.click();
    await waitUntil(() => header.getAttribute("aria-expanded") == "true", {
      waitingFor: "pseudo element rules to expand",
    });
  }
}

function dispatchMouseEvent(element: HTMLElement, eventName: string, eventProperties: any = {}) {
  element.dispatchEvent(
    new MouseEvent(eventName, { view: window, bubbles: true, cancelable: true, ...eventProperties })
  );
}

function dispatchMouseEventInGraphics(eventName: string, x: number, y: number) {
  const graphicsNode = document.getElementById("graphics")!;
  const bounds = graphicsNode.getBoundingClientRect();
  const scale = bounds.width / graphicsNode.offsetWidth;
  const pixelRatio = getDevicePixelRatio();
  const clientX = bounds.left + x * scale * pixelRatio;
  const clientY = bounds.top + y * scale * pixelRatio;
  dispatchMouseEvent(document.body, eventName, { clientX, clientY });
}

async function checkHighlighterVisible(visible: boolean) {
  await waitUntil(
    () => {
      const highlighterNode = document.getElementById("box-model-elements");
      // @ts-expect-error "hidden" is not a number?
      const isVisible = highlighterNode?.attributes["hidden"]?.textContent !== "true";
      return isVisible === visible;
    },
    { waitingFor: `highlighter to be ${visible ? "" : "in"}visible` }
  );
}

async function checkHighlighterShape(svgPath: string) {
  const expectedCoords = svgPath.substring(1).split(/ L|,/);
  const highlighterPath: string = await waitUntil(
    () => {
      const highlighterNode = document.getElementById("box-model-content")!;
      // @ts-expect-error "d" is not a number?
      return highlighterNode?.attributes["d"].textContent;
    },
    { waitingFor: "highlighter to appear" }
  );
  const highlighterCoords = highlighterPath.substring(1).split(/ L|,/);
  for (let i = 0; i < 8; i++) {
    if (Math.abs(Number(highlighterCoords[i]) - Number(expectedCoords[i])) >= 1) {
      console.log(`expected ${expectedCoords}, received ${highlighterCoords}`);
      return false;
    }
  }
}

async function getMouseTarget(x: number, y: number) {
  return await ThreadFront.getMouseTarget(x, y);
}

async function getRecordingTarget() {
  return ThreadFront.recordingTargetWaiter.promise;
}

const testCommands = {
  addBreakpoint,
  addEventListenerLogpoints,
  addLogpoint,
  assert,
  checkAllMessages,
  checkAutocompleteMatches,
  checkAppliedRules,
  checkComputedStyle,
  checkEvaluateInTopFrame,
  checkFrames,
  checkHighlighterShape,
  checkHighlighterVisible,
  checkJumpIcon,
  checkPausedMessage,
  clearConsoleEvaluations,
  disableBreakpoint,
  dispatchMouseEvent,
  dispatchMouseEventInGraphics,
  executeInConsole,
  findMarkupNode,
  findMessageExpandableObjectInspector,
  findMessages,
  findScopeNode,
  getAllMessages,
  getAppliedRulesJSON,
  getMarkupCanvasCoordinate,
  getMatchedSelectors,
  getMouseTarget,
  getRecordingTarget,
  loadRegion,
  pickNode,
  removeAllBreakpoints,
  resumeToLine,
  reverseStepOverToLine,
  rewindToLine,
  searchMarkup,
  selectConsole,
  selectFrame,
  selectInspector,
  selectMarkupNode,
  selectReactDevTools,
  selectSource,
  setBreakpointOptions,
  setLonghandsExpanded,
  stepInToLine,
  stepOutToLine,
  stepOverAndPause,
  stepOverToLine,
  toggleExceptionLogging,
  toggleMappedSources,
  toggleMarkupNode,
  toggleObjectInspectorNode,
  toggleScopeNode,
  unloadRegion,
  waitForFrameTimeline,
  waitForLoadedScopes,
  waitForMessage,
  waitForMessageCount,
  waitForPaused,
  waitForPausedLine,
  waitForScopeValue,
  waitForSelectedMarkupNode,
  waitForSource,
  waitForTime,
  waitUntil,
  warpToMessage,
  writeInConsole,
};

function isThenable(obj: any): obj is Promise<any> {
  return obj !== null && typeof obj === "object" && typeof obj.then === "function";
}

const commands = mapValues(testCommands, (command, name) => {
  return (...args: any[]) => {
    console.log(`Starting ${name}`, ...args);
    const startTime = new Date().getTime();
    // @ts-expect-error spreading args is FINE TS!
    let result = command(...args);
    if (isThenable(result)) {
      return result.then(
        async result => {
          const duration = new Date().getTime() - startTime;
          console.log(`Finished ${name} in ${duration}ms`);
          return result;
        },
        error => {
          console.error(`Error for ${name}`, error);
        }
      );
    }
    const duration = new Date().getTime() - startTime;
    console.log(`Finished ${name} in ${duration}ms`);
    return result;
  };
});

export async function describe(description: string, cbk: () => void) {
  console.log(`# Test ${description}`);
  try {
    await start();
    await cbk();
    finish();
  } catch (e: any) {
    console.log("TestFinished", { success: false, why: e.message });
  }
}

export async function it(description: string, cbk: () => void) {
  console.log(`## ${description}`);
  await cbk();
}

const TestHarness = { ...commands, dbg, dbgSelectors, app, start, finish, describe, it };

export default TestHarness;

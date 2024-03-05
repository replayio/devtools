import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  checkAppliedRules,
  openElementsPanel,
  selectElementsListRow,
} from "../helpers/elements-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_inspector_styles.html" });

test("inspector-rules-01: Basic CSS rules should be viewed", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");

  await openElementsPanel(page);

  await selectElementsListRow(page, { text: 'id="maindiv"' });
  await checkAppliedRules(page, [
    {
      selector: "div::first-letter",
      source: "styles.css:26",
      properties: [{ text: "color: teal;", overridden: false }],
    },
    {
      selector: "element",
      source: "inline",
      properties: [{ text: "background-color: blue;", overridden: false }],
    },
    {
      selector: "body div",
      source: "styles.css:16",
      properties: [
        { text: "background-color: red;", overridden: true },
        { text: "color: black !important;", overridden: false },
      ],
    },
    {
      selector: "div",
      source: "styles.css:21",
      properties: [
        { text: "background-color: black;", overridden: true },
        { text: "color: white !important;", overridden: true },
      ],
    },
    {
      selector: "body",
      source: "styles.css:11",
      properties: [
        // TODO [FE-786]
        { overridden: true, text: "background-color: green;" },
        { text: "font-size: large;", overridden: false },
      ],
    },
  ]);

  await selectElementsListRow(page, { text: 'id="conflict"' });
  await checkAppliedRules(page, [
    {
      selector: "div::first-letter",
      source: "styles.css:26",
      properties: [{ text: "color: teal;", overridden: false }],
    },
    {
      selector: "#conflict",
      source: "styles.css:6",
      properties: [
        { text: "background-color: gray;", overridden: false },
        { text: "font-size: x-large;", overridden: false },
      ],
    },
    {
      selector: "#conflict",
      source: "styles.css:2",
      properties: [{ text: "background-color: blue;", overridden: true }],
    },
    {
      selector: "body div",
      source: "styles.css:16",
      properties: [
        { text: "background-color: red;", overridden: true },
        { text: "color: black !important;", overridden: false },
      ],
    },
    {
      selector: "div",
      source: "styles.css:21",
      properties: [
        { text: "background-color: black;", overridden: true },
        { text: "color: white !important;", overridden: true },
      ],
    },
    {
      selector: "body",
      source: "styles.css:11",
      properties: [
        // TODO [FE-786]
        { overridden: true, text: "background-color: green;" },
        // TODO [FE-786]
        { text: "font-size: large;", overridden: true },
      ],
    },
  ]);

  await selectElementsListRow(page, { text: 'id="important"' });
  await checkAppliedRules(page, [
    {
      selector: "div::first-letter",
      source: "styles.css:26",
      properties: [{ text: "color: teal;", overridden: false }],
    },
    {
      selector: "#important",
      source: "styles.css:34",
      properties: [{ text: "background-color: black;", overridden: true }],
    },
    {
      selector: "#important",
      source: "styles.css:30",
      properties: [{ text: "background-color: purple !important;", overridden: false }],
    },
    {
      selector: "body div",
      source: "styles.css:16",
      properties: [
        { text: "background-color: red;", overridden: true },
        { text: "color: black !important;", overridden: false },
      ],
    },
    {
      selector: "div",
      source: "styles.css:21",
      properties: [
        { text: "background-color: black;", overridden: true },
        { text: "color: white !important;", overridden: true },
      ],
    },
    {
      selector: "body",
      source: "styles.css:11",
      properties: [
        // TODO [FE-786]
        { overridden: true, text: "background-color: green;" },
        { text: "font-size: large;", overridden: false },
      ],
    },
  ]);
});

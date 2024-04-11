import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  checkAppliedRules,
  expandLonghands,
  openElementsPanel,
  selectElementsListRow,
} from "../helpers/elements-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_inspector_shorthand.html" });

test("inspector-rules-03: Shorthand CSS rules should be viewed", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");
  await openElementsPanel(page);

  await selectElementsListRow(page, { text: '<div class="parent" id="first">' });
  await checkAppliedRules(page, [
    {
      selector: ".parent",
      source: "shorthand_styles.css:1",
      properties: [
        { text: "margin-left: 10px;", overridden: false },
        { text: "font: italic small-caps bold 24px courier;", overridden: false },
      ],
    },
  ]);

  await expandLonghands(page);
  // TODO [FE-787]
  /*
  await checkAppliedRules(page, [
    {
      selector: ".parent",
      source: "shorthand_styles.css:1",
      properties: [
        { text: "margin-left: 10px;", overridden: false },
        {
          text: "font: italic small-caps bold 24px courier;",
          overridden: false,
          longhandProps: [
            { text: "font-style: italic;", overridden: false },
            { text: "font-variant-caps: small-caps;", overridden: false },
            { text: "font-weight: bold;", overridden: false },
            { text: "font-stretch: normal;", overridden: false },
            { text: "font-size: 24px;", overridden: false },
            { text: "line-height: normal;", overridden: false },
            { text: "font-family: courier;", overridden: false },
            { text: "font-size-adjust: none;", overridden: false },
            { text: "font-kerning: auto;", overridden: false },
            { text: "font-optical-sizing: auto;", overridden: false },
            { text: "font-variant-alternates: normal;", overridden: false },
            { text: "font-variant-east-asian: normal;", overridden: false },
            { text: "font-variant-ligatures: normal;", overridden: false },
            { text: "font-variant-numeric: normal;", overridden: false },
            { text: "font-variant-position: normal;", overridden: false },
            { text: "font-language-override: normal;", overridden: false },
            { text: "font-feature-settings: normal;", overridden: false },
            { text: "font-variation-settings: normal;", overridden: false },
          ],
        },
      ],
    },
  ]);
  */
});

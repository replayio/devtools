import {
  test,
  openExample,
  clickDevTools,
  selectConsole,
  warpToMessage,
  selectInspector,
  addBreakpoint,
  rewindToLine,
  checkComputedStyle,
  selectMarkupNode,
} from "../helpers";

test("Test that styles for elements can be viewed.", async ({ screen }) => {
  await openExample(screen, "doc_inspector_styles.html");
  await clickDevTools(screen);
  await selectConsole(screen);
  await warpToMessage(screen, "ExampleFinished");
  await selectInspector(screen);

  await selectMarkupNode(screen, "body");
  await checkComputedStyle(screen, "background-color", "rgb(0, 128, 0)");

  await selectMarkupNode(screen, "maindiv");
  await checkComputedStyle(screen, "background-color", "rgb(0, 0, 255)");

  await addBreakpoint(screen, { url: "doc_inspector_styles.html", lineNumber: 11 });
  await rewindToLine(screen, { lineNumber: 11 });

  await selectMarkupNode(screen, "maindiv");
  await checkComputedStyle(screen, "background-color", "rgb(255, 0, 0)");
});

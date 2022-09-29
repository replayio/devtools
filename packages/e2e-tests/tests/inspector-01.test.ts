import {
  test,
  openExample,
  clickDevTools,
  selectConsole,
  warpToMessage,
  selectInspector,
  toggleMarkupNode,
  getMarkupNode,
  addBreakpoint,
  rewindToLine,
  searchMarkup,
  waitForSelectedMarkupNode,
  selectNextMarkupSearchResult,
} from "../helpers";

test("Test that scopes are rerendered.", async ({ screen }) => {
  await openExample(screen, "doc_inspector_basic.html");
  await clickDevTools(screen);
  await selectConsole(screen);
  await warpToMessage(screen, "ExampleFinished");
  await selectInspector(screen);

  let node = getMarkupNode(screen, '<div id="maindiv" style="color: red"');
  await node.waitFor();
  await toggleMarkupNode(node);
  await getMarkupNode(screen, "GOODBYE").waitFor();

  await addBreakpoint(screen, { url: "doc_inspector_basic.html", lineNumber: 9 });
  await rewindToLine(screen, { lineNumber: 9 });

  node = getMarkupNode(screen, '<div id="maindiv" style="color: red"');
  await node.waitFor();
  await toggleMarkupNode(node);
  await getMarkupNode(screen, "HELLO").waitFor();

  await searchMarkup(screen, "STUFF");
  await waitForSelectedMarkupNode(screen, "STUFF");

  await selectNextMarkupSearchResult(screen);
  await waitForSelectedMarkupNode(screen, '<div id="div4" some-attribute="STUFF"');
});

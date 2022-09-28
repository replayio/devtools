import {
  test,
  openExample,
  clickDevTools,
  selectConsole,
  warpToMessage,
  waitForScopeValue,
  selectFrame,
  expandFirstScope,
} from "../helpers";

test("Test that scopes are rerendered.", async ({ screen }) => {
  await openExample(screen, "doc_recursion.html");
  await clickDevTools(screen);
  await selectConsole(screen);

  await warpToMessage(screen, "Hello 1");
  await expandFirstScope(screen);
  await waitForScopeValue(screen, "n", "1");

  await selectFrame(screen, 2);
  await waitForScopeValue(screen, "n", "3");

  await selectFrame(screen, 0);
  await waitForScopeValue(screen, "n", "1");
});

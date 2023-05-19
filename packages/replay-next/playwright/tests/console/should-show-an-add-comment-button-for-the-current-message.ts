// This test doesn't work currently because the "add comment" button is disabled when there's no accessToken.
// test("should show an add-comment button for the current message", async ({ page }, testInfo) =>  {
//   await setup(page);
//
//   await toggleProtocolMessage(page, "logs", true);
//
//   const listItem = await locateMessage(page, "console-log",  "This is a log");
//   await takeScreenshot(page, testInfo, listItem, "list-item");
//
//   await listItem.hover();
//   await takeScreenshot(page, testInfo, listItem, "list-item-hovered");
//
//   const fastForwardButton = listItem.locator("[data-test-id=ConsoleMessageHoverButton]");
//   await fastForwardButton.hover();
//   await takeScreenshot(page, testInfo, listItem, "fast-forward-button-hovered");
//
//   await fastForwardButton.click();
//   await takeScreenshot(page, testInfo, listItem, "add-comment-button-hovered");
//
//   await listItem.hover();
//   await takeScreenshot(page, testInfo, listItem, "list-item-current");
// });

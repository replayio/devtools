/* TODO
   Make this test pass in Docker; it passes in OSX (headless or regular Chrome)
test("should support continue to next and previous functionality", async ({ page }, testInfo) =>  {
  // Continue to next should be enabled initially;
  // Continue to previous should not be.
  await expect(await isContinueToNextButtonEnabled(page, sourceId, 14)).toBe(true);
  await expect(await isContinueToPreviousButtonEnabled(page, sourceId, 14)).toBe(false);

  // Go to line 14.
  await verifyCurrentExecutionPoint(page, 14, false);
  await continueTo(page, { lineNumber: 14, direction: "next", sourceId });
  await verifyCurrentExecutionPoint(page, 14);

  // Continue to next and previous buttons should both now be disabled for line 14.
  // Continue to previous should be enabled for line 13
  // And continue to next should be enabled for line 15.
  await expect(await isContinueToNextButtonEnabled(page, sourceId, 13)).toBe(false);
  await expect(await isContinueToPreviousButtonEnabled(page, sourceId, 13)).toBe(true);
  await expect(await isContinueToNextButtonEnabled(page, sourceId, 14)).toBe(false);
  await expect(await isContinueToPreviousButtonEnabled(page, sourceId, 14)).toBe(false);
  await expect(await isContinueToNextButtonEnabled(page, sourceId, 15)).toBe(true);
  await expect(await isContinueToPreviousButtonEnabled(page, sourceId, 15)).toBe(false);
});
*/

/* TODO – This tests passes in OSX but not in Docker
test("should update the current time when the log point timeline is clicked", async ({
  page,
}, testInfo) => {
  const lineNumber = 52;

  await addLogPoint(page, { lineNumber, sourceId });
  await verifyLogPointStep(page, "8", { lineNumber, sourceId });
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: false,
    nextEnabled: true,
  });

  await goToLogPointTimelineTime(page, lineNumber, 0.35);
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: true,
    nextEnabled: true,
  });
});
*/

// This script isn't used by the end-to-end test suite. It is used to support
// randomly exploring recordings with the viewer, for turning up bugs and so forth.
Test.describe(`random walk`, async () => {
  await Test.selectConsole();

  while (true) {
    try {
      await Test.randomAction();
    } catch (e) {
      console.error(e);
    }
    await Test.waitForTime(5000);
  }
});

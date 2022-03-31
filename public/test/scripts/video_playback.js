// Test that video playback updates the screenshot
Test.describe(`video playback.`, async () => {
  await Test.seekToTime(0);
  await Test.startPlayback();

  const start = Date.now();
  let hash = window.currentScreenshotHash;
  let i = 0;
  while (i < 5 && Date.now() - start < 5000) {
    await new Promise(resolve => setTimeout(resolve, 50));
    if (window.currentScreenshotHash !== hash) {
      hash = window.currentScreenshotHash;
      i++;
    }
  }
  Test.assert(i === 5, "the displayed screenshot should change");
});

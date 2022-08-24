Test.describe(`Test event logpoints when replaying.`, async () => {
  await Test.selectConsole();
  await Test.addEventListenerLogpoints(["click"]);

  const msg = await Test.waitForMessage("MouseEvent");

  // TODO This test helper needs to be rewritten
  return;

  // The message's preview should contain useful properties.
  const regexps = [
    /target: div#divvy/,
    /clientX: \d+/,
    /clientY: \d+/,
    /layerX: \d+/,
    /layerY: \d+/,
  ];
  for (const regexp of regexps) {
    Test.assert(regexp.test(msg.textContent), `Message text includes ${regexp}`);
  }

  // When expanded, other properties should be visible.
  await Test.checkMessageObjectContents(msg, ["altKey: false", "bubbles: true"]);
});

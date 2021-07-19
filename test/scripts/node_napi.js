Test.describe(`loading napi modules works.`, async () => {
  await Test.selectConsole();
  await Test.warpToMessage("true");
  await Test.warpToMessage("iVBORw0KGgoAAAANSUhEUgAAAAQAAAAFCAYAAA");
  await Test.warpToMessage("Unmasked [4,4,4,12]");
  await Test.warpToMessage("Remasked [1,2,3,4]");
});

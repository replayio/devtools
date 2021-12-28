Test.describe(`Test basic logpoint functionality.`, async () => {
  const { addLogpoint } = Test;

  await addLogpoint("doc_rr_basic.html", 21);
  await Test.waitForMessageCount("doc_rr_basic.html 21", 10);
});

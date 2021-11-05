Test.describe(`Test that stacktraces are sourcemapped.`, async () => {
  await Test.selectConsole();

  const errorMsg = await Test.waitUntil(() => document.querySelector(".message.error"));

  let trace = errorMsg.querySelector(".objectBox-stackTrace");
  await checkTopFrame(trace);

  const btn = errorMsg.querySelector(".collapse-button");
  btn.click();

  trace = errorMsg.querySelector(".stacktrace");
  await checkTopFrame(trace);
});

function checkTopFrame(trace) {
  return Test.waitUntil(() => {
    const location = trace.children[0].querySelector(".location");
    return location.textContent.trim() === "App.js:28";
  });
}

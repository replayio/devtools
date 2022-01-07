Test.describe(`Test global console evaluation in async frames.`, async () => {
  await Test.selectConsole();

  await Test.addBreakpoint("doc_async.html", 20, undefined, { logValue: '"qux", n' });
  await Test.warpToMessage("qux 2");
  await Test.checkFrames(5);

  await Test.executeInConsole('"eval " + n');

  await Test.selectFrame(2);
  await Test.executeInConsole('"eval " + n');

  await Test.selectFrame(4);
  await Test.executeInConsole('"eval " + n');

  await Test.checkAllMessages(
    [
      { type: "console-api", content: ["foo"] },
      { type: "console-api", content: ["bar"] },
      { type: "command", content: ['"eval " + n'] },
      { type: "result", content: ['ReferenceError: "n is not defined"'] },
      { type: "console-api", content: ["baz", "4"] },
      { type: "logPoint", content: ["qux", "4"] },
      { type: "command", content: ['"eval " + n'] },
      { type: "result", content: ['"eval 4"'] },
      { type: "console-api", content: ["baz", "3"] },
      { type: "logPoint", content: ["qux", "3"] },
      { type: "console-api", content: ["baz", "2"] },
      { type: "logPoint", content: ["qux", "2"] },
      { type: "command", content: ['"eval " + n'] },
      { type: "result", content: ['"eval 2"'] },
      { type: "console-api", content: ["baz", "1"] },
      { type: "logPoint", content: ["qux", "1"] },
      { type: "console-api", content: ["baz", "0"] },
      { type: "logPoint", content: ["qux", "0"] },
      { type: "console-api", content: ["ExampleFinished"] },
    ],
    {
      // ignore error messages, see issue #2056
      ignoreErrors: true,
    }
  );
});

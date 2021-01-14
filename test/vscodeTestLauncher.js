const path = require("path");
const { fork } = require("child_process");
const { readFileSync } = require("fs");

process.on("message", args => {
  if (args.action === "loadTests") {
    const manifest = JSON.parse(readFileSync(path.join(__dirname, "manifest.json")).toString());

    const tests = manifest.map(([test, _]) => {
      return { type: "test", id: test, label: test, debuggable: false };
    });

    process.send({ type: "suite", id: "root", label: "RecordReplay", children: tests });
  } else if (args.action === "runTests") {
    let currentTest = "";

    const childProc = fork(
      path.join(__dirname, "run.js"),
      [].concat(...args.tests.map(test => ["--pattern", test])),
      { stdio: "pipe" }
    );

    const processOutput = output => {
      const match = /Starting test (.*)/.exec(output);
      if (match) {
        if (currentTest) {
          process.send({ type: "test", test: currentTest, state: "failed" });
        }
        currentTest = match[1];
        process.send({ type: "test", test: currentTest, state: "running" });
      }
      if (/TestPassed/.test(output) && currentTest) {
        process.send({ type: "test", test: currentTest, state: "passed" });
        currentTest = "";
      }
    };

    childProc.stdout.on("data", data => {
      const s = data.toString();
      processOutput(s);
      process.stdout.write(s);
    });
    childProc.stderr.on("data", data => {
      const s = data.toString();
      processOutput(s);
      process.stderr.write(s);
    });

    childProc.on("exit", () => {
      if (currentTest) {
        process.send({ type: "test", test: currentTest, state: "failed" });
      }
      process.exit();
    });
  }
});

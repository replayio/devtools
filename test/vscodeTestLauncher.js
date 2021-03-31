const path = require("path");
const { fork } = require("child_process");

/**
 * This script integrates the tests with the Test Explorer extension for VS Code.
 * It (ab)uses the launcher script feature of the Mocha Test Explorer extension
 * (https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter).
 * More information on that feature: https://github.com/hbenl/vscode-test-adapter-remoting-util.
 * You can set environment variables for the tests using the `mochaExplorer.env` setting
 * in `.vscode/settings.json`.
 */
process.on("message", args => {
  if (args.action === "loadTests") {
    const manifest = require("./manifest");

    const tests = manifest
      .filter(({ targets }) => targets.includes("gecko"))
      .map(({ script }) => {
        return { type: "test", id: script, label: script, debuggable: false };
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
      const match = /Starting test (.*) target/.exec(output);
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

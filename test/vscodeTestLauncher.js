const path = require("path");
const { fork } = require("child_process");

const e2eTestPrefix = "e2e/";
const mockTestPrefix = "mock/";

/**
 * This script integrates the tests with the Test Explorer extension for VS Code.
 * It (ab)uses the launcher script feature of the Mocha Test Explorer extension
 * (https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter).
 * More information on that feature: https://github.com/hbenl/vscode-test-adapter-remoting-util.
 * You can set environment variables for the tests using the `mochaExplorer.env` setting
 * in `.vscode/settings.json`.
 */
process.on("message", async args => {
  if (args.action === "loadTests") {
    loadTests();
  } else if (args.action === "runTests") {
    const e2eTests = pickTests(args.tests, e2eTestPrefix);
    if (e2eTests.length > 0) {
      await runE2ETests(e2eTests);
    }

    const mockTests = pickTests(args.tests, mockTestPrefix);
    if (mockTests.length > 0) {
      await runMockTests(mockTests);
    }

    process.exit();
  }
});

function pickTests(tests, prefix) {
  return tests.filter(test => test.startsWith(prefix)).map(test => test.substring(prefix.length));
}

function loadTests() {
  const e2eManifest = require("./manifest");
  const onlyTarget = process.env.TEST_ONLY_TARGET;
  const e2eTests = e2eManifest
    .filter(({ targets }) => !onlyTarget || targets.includes(onlyTarget))
    .map(({ script }) => ({
      type: "test",
      id: e2eTestPrefix + script,
      label: script,
      debuggable: false,
    }));

  const mockManifest = require("./mock/manifest");
  const mockTests = mockManifest.map(script => ({
    type: "test",
    id: mockTestPrefix + script,
    label: script,
    debuggable: false,
  }));

  process.send({
    type: "suite",
    id: "root",
    label: "RecordReplay",
    children: [
      {
        type: "suite",
        id: "e2e",
        label: "E2E",
        children: e2eTests,
      },
      {
        type: "suite",
        id: "mock",
        label: "Mock",
        children: mockTests,
      },
    ],
  });
}

function runE2ETests(tests) {
  const args = [].concat(...tests.map(test => ["--pattern", test]));
  const onlyTarget = process.env.TEST_ONLY_TARGET;
  if (onlyTarget) {
    args.push("--target", onlyTarget);
  }
  return runTests(
    path.join(__dirname, "run.js"),
    args,
    e2eTestPrefix,
    /Recording Test: ([^ ]*) /,
    /Finished test:([^ ]*) success:([^ ]*)/
  );
}

function runMockTests(tests) {
  return runTests(
    path.join(__dirname, "mock/run.js"),
    [].concat(...tests.map(test => ["--pattern", test])),
    mockTestPrefix,
    /Starting test (.*)/,
    /Test succeeded/
  );
}

function runTests(runScript, runArgs, testPrefix, startRegex, finishRegex) {
  return new Promise(resolve => {
    let currentTest = "";

    const childProc = fork(runScript, runArgs, { stdio: "pipe" });

    const processOutput = output => {
      let match = startRegex.exec(output);
      if (match) {
        if (currentTest) {
          process.send({ type: "test", test: currentTest, state: "failed" });
        }
        currentTest = testPrefix + match[1];
        process.send({ type: "test", test: currentTest, state: "running" });
      }
      match = finishRegex.exec(output);
      if (match && currentTest) {
        const success = match[2] !== "false";
        process.send({ type: "test", test: currentTest, state: success ? "passed" : "failed" });
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
      resolve();
    });
  });
}

// Test getting a session error on startup.

const { runTest, devtoolsURL } = require("../src/runTest");
const { installMockEnvironment } = require("../src/mockEnvironment");
const { v4: uuid } = require("uuid");

// Test that getting a session error while loading a replay shows an appropriate error.
runTest("sessionError", async page => {
  await page.goto(devtoolsURL({ id: uuid() }));
  await installMockEnvironment(page, { sessionError: true });
  await page.textContent("text=Unexpected session error");
});

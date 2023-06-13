## Replay E2E Tests

This package contains Replay's Playwright E2E tests. These tests primarily cover execution and features of the Replay debugging client UI, but also exercise features of our backend as well.

The tests use Playwright to drive browser instances that interact with the Replay UI, and the Replay-Playwright fork specifically to let us make recordings of the browser executing the test.

### How to run the tests

### Initial setup

As one-time initial setup, install all packages plus the Playwright browsers:

```bash
# Run Yarn to ensure all packages in the repo are installed
# You may have done this already as part of the general dev workflow
yarn

# Run the `test:install` command specifically to install Playwright browsers
cd packages/e2e-tests
yarn test:install
```

### Running Tests

In another terminal, run `yarn dev` from the root of the repo to run the Replay client dev server on `localhost:8080`.

Then, in this `packages/e2e-tests` folder, run `yarn test` to launch Playwright and run the tests.

```bash
# Run _all_ tests, headless, with multiple workers
yarn test

# Run a subset of tests by matching filenames
yarn test some_test_name

# Run tests with a visible browser
yarn test:debug
```

- chromium
- replay firefox

### Concepts

Our E2E tests interact with the Replay client UI like any user would: by finding appropriate parts of the DOM and clicking on them.

Replay, in turn, is a debugger, and we have to load recordings into the UI.

Our tests need to work with known data, and we also want to exercise specific aspects of Replay's behavior. To do this, we have a set of pre-written example files that demonstrates various aspects of JS behavior (control flow, exceptions, async, sourcemaps, etc). These files are pre-recorded as you would any other app, and then the tests themselves open up a specific example file recording in Replay and programmatically drive our UI to debug the recording.

Our old E2E test suite re-recorded those examples every time the test suite ran. To speed up the tests, we now make a single set of "golden recordings" ahead of time, and save the known recording IDs in `examples.json`. Then, every time we run the tests, we look up the corresponding recording ID for a given example file, and open up that existing recording.

The tests themselves are written using a set of "page object"-style helper functions that abstract specific pieces of DOM interaction. This allows the tests themselves to be written in a more readable style and focus on the sequence of operations:

```ts
test(`Test stepping forward through breakpoints when rewound before the first one.`, async ({
  page,
}) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 8, url });
  // Rewind to when the point was hit
  await rewindToLine(page, { lineNumber: 8 });
  // Rewind further (past the first hit)
  await rewindToLine(page);

  await removeBreakpoint(page, { lineNumber: 8, url });

  await addBreakpoint(page, { lineNumber: 21, url });
  await resumeToLine(page, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(page, "number", "1");
  await resumeToLine(page, { lineNumber: 21 });
  await executeAndVerifyTerminalExpression(page, "number", "2");
});
```

When we run the tests in CI, we then make recordings of the browser that is executing the tests. This means we've got a nested recording of a recording going on:

- We recorded the original example file like `doc_rr_basic.html`
- We then recorded the Playwright browser loading Replay to debug the example file recording
- And then we as developers can open up the Replay app ourselves to debug the recording of the test run

### How to record examples

Examples can be re-recorded using the `scripts/save-examples.ts` script. To see all supported configuration parameters run:

```sh
./scripts/save-examples.ts --help
```

For example, to re-record the _control flow_ test using _node_ you would run:

```sh
./scripts/save-examples.ts --target=node --example=control_flow
```

### Updating Cypress Test Examples

Most of our E2E tests work by having "golden recordings" of the small HTML+JS example files in `public/test`. However, for our Cypress Test Panel E2E tests, we need to work with existing Cypress test recordings as the "golden recordings" that our UI is checked against.

We currently use 2 specific Cypress test recordings, from these repos:

- `"cypress-realworld/bankaccounts.spec.js"`:
  - repo: https://github.com/replayio-public/cypress-realworld-app
- `"flake/adding-spec.ts"`:
  - repo: https://github.com/replayio-public/flake

Each repo has a link to the Replay dashboard workspace + an invite.

If you want to update those to fresher recording IDs, open up the team workspace for that repo, find a recent test suite run, copy the recording ID for that test's recording, and overwrite the recording ID in `examples.json`.

You'll also probably need to specifically share that recording as "Public", especially since it's in a Test Suites workspace that would normally not allow anonymous users to view recordings.

### Folder Structure

From the root of the repo:

- `/packages/e2e-tests`:
  - `/tests`: all of the actual E2E test files
  - `/helpers`: "page object"-style helper functions to interact with the client DOM, as well as other assorted utils
  - `/scripts/save-examples.ts`: TS-Node script to re-record "golden" recording files for different examples
  - `config.ts`: Configuration for scripts
  - `examples.json`: contains IDs of "golden recordings" for each of the known example files that our tests expect to debug
  - `playwright.config.ts`: Playwright configuration options
- `/public/test/examples`: pre-written example files with specific code that demonstrates assorted aspects of JavaScript behavior (control flow, exceptions, async, sourcemaps). These are the files that are turned into the "golden recordings" that we load and debug during each test.
- `/test/examples/node`: more pre-written example files for Node execution specifically

### Debugging Tips

When developing on the tests, use `yarn test:debug name_of_test` to show the actual browser during test execution instead of having it run headless.

We have a `debugPrint()` function that we use in several of the helper methods to give us a visible indication of progress. Those are printed to the console by Playwright during local dev execution, and now also printed to the console of the browser that is executing the test. This means that when we record the _test_ execution, you can see the same progress logs while debugging the recording of the test.

#### Cannot find a locator

#### Function is not called

## High level concepts

At a high level, the following concepts/types exist in the current Test Suites implementation:

### TestSuite

A test suite is a group of tests that are run together by a shared trigger (e.g. a GitHub Workflow) as well as a summarized outcome (e.g. the number of passed, failed, or flaky tests). Test suites _may_ include metadata about their trigger, such as the Git branch and commit.

### GroupedTestCases

A test case is a sequence of actions necessary to verify a specific functionality or feature. Test runner may batch more than one test case together when running them. For example, Playwright runs each test case independently (in its own browser/context) whereas Cypress group multiple test cases together, based on which file they are defined in.

### TestRecording

Test cases are recorded by Replay while running. These recordings contain a set of “events” (see below) that are grouped by section: `beforeAll`, `beforeEach`, `afterAll`, `afterEach`, and the `main` test block. The relationship between a test case and a recording varies by runner.

- With Cypress, multiple test cases may be in a single recording.
- With Playwright, a test case may be split across multiple recordings (see [browser contexts](https://playwright.dev/docs/api/class-browsercontext)).

### TestEvent

The building blocks of a test case. This includes user actions (e.g. a command or an assertion), navigations, and network requests.

### Annotation

Used to define the precise boundaries of a test action (execution point and time) and to store data required to preview action values.

- ⚠️ **Note** I prefer that the client should not care too much about this concept. Ideally the test data presented to the client from the backend would abstract over this as much as possible so that the client. This might be controversial and require further discussion.

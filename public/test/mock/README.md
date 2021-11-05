# Mock Tests

The mock test suite is a set of full-browser tests where all communication with remote servers is mocked.  This allows for testing a variety of devtools behaviors which other end-to-end tests cannot.

## Running

Individual tests can be run with `ts-node -r tsconfig-paths/register test/mock/scripts/<script>.ts`. Use the `replay-recordings` CLI tool to inspect the generated recordings.

The entire test suite can be run with `node test/mock/run.js`

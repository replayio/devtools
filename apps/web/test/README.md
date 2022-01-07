## E2E Test Runner

The End To End test runner is responsible for running tests for our forks of Node, Gecko, and Chromium on Mac OSX, Linux, and Windows.

### Tests

Tests are defined in the `manifest.js` file.

```json
{
  "example": "doc_rr_basic.html",
  "script": "breakpoints-01.js",
  "targets": ["gecko", "chromium"]
}
```

### How to run

It's possible to run a single test with the `--pattern` parameter.

`node test/run.js --pattern breakpoints-02 `

Other params are available in `-h` or simply look at `src/state.js`.

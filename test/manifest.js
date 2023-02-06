// Define the different devtools end-to-end tests and how to run them.
//
// Entries in this array have the following required properties:
//
// example: Path to file to use to create a recording in the "examples" folder.
// script: Test script to run when replaying the recording in the "scripts" folder.
// targets: Supported targets for running the test. Allowed values: "gecko", "chromium", "node"
module.exports = [
  {
    example: "doc_async.html",
    script: "console_async_eval.js",
    targets: ["gecko", "chromium"],
  }
];

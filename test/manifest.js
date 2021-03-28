// Define the different devtools end-to-end tests and how to run them.
//
// Entries in this array have the following required properties:
//
// example: Path to file to use to create a recording in the "examples" folder.
// script: Test script to run when replaying the recording in the "scripts" folder.
// targets: Supported targets for running the test. Allowed values: "gecko", "chromium", "node"
module.exports = [
  //////////////////////////////////////////////////////////////////////////////
  // Breakpoints
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_rr_basic.html",
    script: "breakpoints-01.js",
    targets: ["gecko", "chromium"],
  },
  // Not supported on chromium: this test uses dump() to trigger an evaluation
  // failure, but dump() is not a standard function and isn't implemented in chromium.
  {
    example: "doc_rr_basic.html",
    script: "breakpoints-02.js",
    targets: ["gecko"],
  },
  {
    example: "doc_rr_basic.html",
    script: "breakpoints-03.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_control_flow.html",
    script: "breakpoints-04.js",
    targets: ["gecko"],
  },
  {
    example: "doc_debugger_statements.html",
    script: "breakpoints-05.js",
    targets: ["gecko"],
  },
  {
    example: "doc_prod_bundle.html",
    script: "breakpoints-06.js",
    targets: ["gecko"],
  },
  {
    example: "node/control_flow.js",
    script: "node_control_flow.js",
    targets: ["node"],
  },

  //////////////////////////////////////////////////////////////////////////////
  // Stepping
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_rr_basic.html",
    script: "stepping-01.js",
    targets: ["gecko"],
  },
  {
    example: "doc_rr_basic.html",
    script: "stepping-02.js",
    targets: ["gecko"],
  },
  {
    example: "doc_rr_basic.html",
    script: "stepping-03.js",
    targets: ["gecko"],
  },
  {
    example: "doc_rr_blackbox.html",
    script: "stepping-04.js",
    targets: ["gecko"],
  },
  {
    example: "doc_minified.html",
    script: "stepping-05.js",
    targets: ["gecko"],
  },
  {
    example: "doc_async.html",
    script: "stepping-06.js",
    targets: ["gecko"],
  },

  //////////////////////////////////////////////////////////////////////////////
  // Console
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_rr_error.html",
    script: "console_warp-01.js",
    targets: ["gecko"],
  },
  {
    example: "doc_rr_logs.html",
    script: "console_warp-02.js",
    targets: ["gecko"],
  },
  {
    example: "doc_rr_basic.html",
    script: "console_eval.js",
    targets: ["gecko"],
  },
  {
    example: "doc_async.html",
    script: "console_async_eval.js",
    targets: ["gecko"],
  },
  {
    example: "doc_rr_console.html",
    script: "console_messages.js",
    targets: ["gecko"],
  },
  {
    example: "doc_exceptions_bundle.html",
    script: "console_stacks.js",
    targets: ["gecko"],
  },
  {
    example: "doc_recursion.html",
    script: "scopes_rerender.js",
    targets: ["gecko"],
  },
  {
    example: "node/basic.js",
    script: "node_console-01.js",
    targets: ["node"],
  },

  //////////////////////////////////////////////////////////////////////////////
  // Logpoints
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_rr_basic.html",
    script: "logpoint-01.js",
    targets: ["gecko"],
  },
  {
    example: "doc_rr_basic.html",
    script: "logpoint-02.js",
    targets: ["gecko"],
  },
  {
    example: "doc_events.html",
    script: "logpoint-03.js",
    targets: ["gecko"],
  },
  {
    example: "doc_exceptions.html",
    script: "logpoint-04.js",
    targets: ["gecko"],
  },
  {
    example: "node/basic.js",
    script: "node_logpoint-01.js",
    targets: ["node"],
  },

  //////////////////////////////////////////////////////////////////////////////
  // Objects
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_rr_objects.html",
    script: "object_preview-01.js",
    targets: ["gecko"],
  },
  {
    example: "doc_rr_objects.html",
    script: "object_preview-02.js",
    targets: ["gecko"],
  },
  {
    example: "doc_rr_preview.html",
    script: "object_preview-03.js",
    targets: ["gecko"],
  },
  {
    example: "doc_prod_bundle.html",
    script: "object_preview-05.js",
    targets: ["gecko"],
  },
  {
    example: "node/objects.js",
    script: "node_object_preview-01.js",
    targets: ["node"],
  },

  //////////////////////////////////////////////////////////////////////////////
  // DOM Inspection
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_inspector_basic.html",
    script: "inspector-01.js",
    targets: ["gecko"],
  },
  {
    example: "doc_inspector_basic.html",
    script: "inspector-02.js",
    targets: ["gecko"],
  },
  {
    example: "doc_inspector_styles.html",
    script: "inspector-03.js",
    targets: ["gecko"],
  },
  {
    example: "doc_inspector_styles.html",
    script: "inspector-04.js",
    targets: ["gecko"],
  },
  {
    example: "doc_inspector_sourcemapped.html",
    script: "inspector-05.js",
    targets: ["gecko"],
  },
  {
    example: "doc_inspector_shorthand.html",
    script: "inspector-06.js",
    targets: ["gecko"],
  },
  {
    example: "doc_inspector_shorthand.html",
    script: "inspector-07.js",
    targets: ["gecko"],
  },
  {
    example: "doc_inspector_basic.html",
    script: "highlighter.js",
    targets: ["gecko"],
  },

  //////////////////////////////////////////////////////////////////////////////
  // Miscellaneous
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_rr_worker.html",
    script: "worker-01.js",
    targets: ["gecko"],
  },
  {
    example: "node/spawn.js",
    script: "node_spawn-01.js",
    targets: ["node"],
  },
  {
    example: "node/run_worker.js",
    script: "node_worker-01.js",
    targets: ["node"],
  },
  {
    example: "node/napi.js",
    script: "node_napi.js",
    targets: ["node"],
  },
];

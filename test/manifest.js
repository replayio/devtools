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
  {
    example: "doc_rr_basic.html",
    script: "breakpoints-02.js",
    // Not supported on chromium: this test uses dump() to trigger an evaluation
    // failure, but dump() is not a standard function and isn't implemented
    // in chromium.
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
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_debugger_statements.html",
    script: "breakpoints-05.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_prod_bundle.html",
    script: "breakpoints-06.js",
    // Not supported on chromium, needs source maps.
    // https://github.com/RecordReplay/chromium/issues/5
    targets: ["gecko"],
  },
  {
    example: "doc_navigate.html",
    script: "breakpoints-07.js",
    targets: ["gecko", "chromium"],
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
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_basic.html",
    script: "stepping-02.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_basic.html",
    script: "stepping-03.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_blackbox.html",
    script: "stepping-04.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_minified.html",
    script: "stepping-05.js",
    // Not supported on chromium, needs event listener support.
    // https://github.com/RecordReplay/chromium/issues/7
    targets: ["gecko"],
  },
  {
    example: "doc_async.html",
    script: "stepping-06.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "node/async.js",
    script: "node_stepping-01.js",
    targets: ["node"],
  },

  //////////////////////////////////////////////////////////////////////////////
  // Console
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_rr_error.html",
    script: "console_warp-01.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_logs.html",
    script: "console_warp-02.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_basic.html",
    script: "console_eval.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_async.html",
    script: "console_async_eval.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_console.html",
    saveFixture: true,
    script: "console_messages.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_exceptions_bundle.html",
    script: "console_stacks.js",
    // Not supported on chromium, needs source maps.
    // https://github.com/RecordReplay/chromium/issues/5
    targets: ["gecko"],
  },
  {
    example: "doc_recursion.html",
    script: "scopes_rerender.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "cra/dist/index.html",
    script: "sourcemap_stacktrace.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "node/basic.js",
    script: "node_console-01.js",
    targets: ["node"],
  },
  {
    example: "node/error.js",
    script: "node_console-02.js",
    targets: ["node"],
  },

  //////////////////////////////////////////////////////////////////////////////
  // Logpoints
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_rr_basic.html",
    script: "logpoint-01.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_basic.html",
    script: "logpoint-02.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_events.html",
    script: "logpoint-03.js",
    // Not supported on chromium, needs event listener support.
    // https://github.com/RecordReplay/chromium/issues/7
    targets: ["gecko"],
  },
  {
    example: "doc_exceptions.html",
    script: "logpoint-04.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_basic.html",
    script: "logpoint-05.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "node/basic.js",
    script: "node_logpoint-01.js",
    targets: ["node"],
  },
  {
    example: "node/exceptions.js",
    script: "node_logpoint-02.js",
    targets: ["node"],
  },

  //////////////////////////////////////////////////////////////////////////////
  // Objects
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_rr_objects.html",
    script: "object_preview-01.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_objects.html",
    script: "object_preview-02.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_preview.html",
    script: "object_preview-03.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_prod_bundle.html",
    script: "object_preview-05.js",
    // Not supported on chromium, needs source maps.
    // https://github.com/RecordReplay/chromium/issues/5
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

  // DOM inspection tests are not currently supported on chromium.
  // https://github.com/RecordReplay/chromium/issues/11
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
  {
    example: "doc_stacking.html",
    script: "stacking.js",
    targets: ["gecko"],
  },

  //////////////////////////////////////////////////////////////////////////////
  // Region loading
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_rr_region_loading.html",
    script: "region_loading-01.js",
    targets: ["gecko", "chromium"],
  },

  //////////////////////////////////////////////////////////////////////////////
  // Miscellaneous
  //////////////////////////////////////////////////////////////////////////////

  {
    example: "doc_rr_objects.html",
    script: "autocomplete.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_basic.html",
    script: "settings.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_rr_worker.html",
    script: "worker-01.js",
    targets: ["gecko", "chromium"],
  },
  {
    // Disabled because we can't record the example in CI
    // https://github.com/RecordReplay/gecko-dev/issues/726
    disabled: true,
    example: "cra/dist/index.html",
    script: "react_devtools.js",
    targets: ["gecko", "chromium"],
  },
  {
    example: "doc_control_flow.html",
    script: "repaint.js",
    targets: ["gecko", "chromium"],
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
    // Disabled because we can't record the example
    // https://github.com/RecordReplay/node/issues/69
    disabled: true,
    example: "node/napi.js",
    script: "node_napi.js",
    targets: ["node"],
  },
];

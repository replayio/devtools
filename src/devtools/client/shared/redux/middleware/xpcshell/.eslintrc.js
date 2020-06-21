"use strict";

module.exports = {
  globals: {
    run_test: true,
    run_next_test: true,
    equal: true,
    do_print: true,
  },
  rules: {
    // Stop giving errors for run_test
    camelcase: "off",
  },
};

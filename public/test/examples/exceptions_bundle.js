/******/ (function() { // webpackBootstrap
var __webpack_exports__ = {};
/*!*************************!*\
  !*** ./bundle_input.js ***!
  \*************************/
// webpack input for exceptions_bundle.js
function recordingFinished() {
  console.log("ExampleFinished");
}
setTimeout(foo, 0);
function foo() {
  setTimeout(followup, 0);
  try {
    bar();
  } catch (e) {}
  baz();
}
function bar() {
  console.trace("ConsoleTrace");
  console.warn("ConsoleWarn");
  console.error("ConsoleError");
  console.assert(false, "ConsoleAssert");
  throw { number: 42 };
}
function baz() {
  throw new Error("UncaughtError");
}
function followup() {
  setTimeout(recordingFinished, 0);
  uncaughtPrimitive();
}
function uncaughtPrimitive() {
  throw { number: 12 };
}

/******/ })()
;
//# sourceMappingURL=exceptions_bundle.js.map
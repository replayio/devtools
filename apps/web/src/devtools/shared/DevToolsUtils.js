function assert(v) {
  if (!v) {
    throw new Error("Assertion failed!");
  }
}

module.exports = { assert };

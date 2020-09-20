const JSBI = require("jsbi");

function pointEquals(p1, p2) {
  p1 == p2;
}

function pointPrecedes(p1, p2) {
  return JSBI.lessThan(JSBI.BigInt(p1), JSBI.BigInt(p2));
}

function pointToString(p) {
  return p;
}

module.exports = {
  pointEquals,
  pointPrecedes,
};

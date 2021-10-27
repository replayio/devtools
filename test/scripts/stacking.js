Test.describe(
  `Test that the element highlighter selects the correct element when they overlap.`,
  async () => {
    await Test.selectInspector();

    // elements are stacked in the order in which they appear in the DOM (from back to front)
    let target = await Test.getMouseTarget(40, 40);
    Test.assert(quadsAreEqual(target._rect, [30, 30, 70, 70]));

    // positioned elements are in front of unpositioned ones
    target = await Test.getMouseTarget(140, 40);
    Test.assert(quadsAreEqual(target._rect, [110, 10, 150, 50]));

    // parent elements are in front of children with a negative z-index
    target = await Test.getMouseTarget(240, 40);
    Test.assert(quadsAreEqual(target._rect, [200, 0, 280, 80]));

    // elements with a higher z-index are in front of those with a lower one
    target = await Test.getMouseTarget(340, 40);
    Test.assert(quadsAreEqual(target._rect, [310, 10, 350, 50]));

    // floating elements are in front of unpositioned elements
    target = await Test.getMouseTarget(40, 130);
    Test.assert(quadsAreEqual(target._rect, [0, 100, 40, 140]));

    // elements with visibility: hidden are ignored
    target = await Test.getMouseTarget(140, 140);
    Test.assert(quadsAreEqual(target._rect, [110, 110, 150, 150]));

    // elements with pointer-events: none are ignored
    target = await Test.getMouseTarget(240, 140);
    Test.assert(quadsAreEqual(target._rect, [210, 110, 250, 150]));
  }
);

function quadsAreEqual(q1, q2) {
  for (let i = 0; i < 4; i++) {
    if (q1[i] !== q2[i]) {
      return false;
    }
  }
  return true;
}

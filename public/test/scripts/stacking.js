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
    Test.assert(quadsAreEqual(target._rect, [5, 105, 45, 145]));

    // elements with visibility: hidden are ignored
    target = await Test.getMouseTarget(140, 140);
    Test.assert(quadsAreEqual(target._rect, [110, 110, 150, 150]));

    // elements with pointer-events: none are ignored
    target = await Test.getMouseTarget(240, 140);
    Test.assert(quadsAreEqual(target._rect, [210, 110, 250, 150]));

    // the z-index is ignored for unpositioned elements
    target = await Test.getMouseTarget(340, 140);
    Test.assert(quadsAreEqual(target._rect, [330, 130, 370, 170]));

    // ... except if they are flex items
    target = await Test.getMouseTarget(40, 240);
    Test.assert(quadsAreEqual(target._rect, [5, 205, 45, 245]));

    // ... or grid items
    target = await Test.getMouseTarget(140, 240);
    Test.assert(quadsAreEqual(target._rect, [105, 205, 145, 245]));

    // positioned elements without z-index don't create a stacking context
    target = await Test.getMouseTarget(240, 240);
    Test.assert(quadsAreEqual(target._rect, [210, 210, 250, 250]));

    // children of positioned elements are in front of children of unpositioned ones
    target = await Test.getMouseTarget(340, 240);
    Test.assert(quadsAreEqual(target._rect, [310, 210, 350, 250]));
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

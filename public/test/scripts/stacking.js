Test.describe(
  `Test that the element highlighter selects the correct element when they overlap.`,
  async () => {
    await Test.selectConsole();
    await Test.warpToMessage("ExampleFinished");

    await Test.selectInspector();

    // elements are stacked in the order in which they appear in the DOM (from back to front)
    let target = await Test.getMouseTarget(40, 40);
    Test.assert(quadsAreEqual(target._rects, [[30, 30, 70, 70]]));

    // positioned elements are in front of unpositioned ones
    target = await Test.getMouseTarget(140, 40);
    Test.assert(quadsAreEqual(target._rects, [[110, 10, 150, 50]]));

    // parent elements are in front of children with a negative z-index
    target = await Test.getMouseTarget(240, 40);
    Test.assert(quadsAreEqual(target._rects, [[200, 0, 280, 80]]));

    // elements with a higher z-index are in front of those with a lower one
    target = await Test.getMouseTarget(340, 40);
    Test.assert(quadsAreEqual(target._rects, [[310, 10, 350, 50]]));

    // floating elements are in front of unpositioned elements
    target = await Test.getMouseTarget(40, 130);
    Test.assert(quadsAreEqual(target._rects, [[5, 105, 45, 145]]));

    // elements with visibility: hidden are ignored
    target = await Test.getMouseTarget(140, 140);
    Test.assert(quadsAreEqual(target._rects, [[110, 110, 150, 150]]));

    // elements with pointer-events: none are ignored
    target = await Test.getMouseTarget(240, 140);
    Test.assert(quadsAreEqual(target._rects, [[210, 110, 250, 150]]));

    // the z-index is ignored for unpositioned elements
    target = await Test.getMouseTarget(340, 140);
    Test.assert(quadsAreEqual(target._rects, [[330, 130, 370, 170]]));

    // ... except if they are flex items
    target = await Test.getMouseTarget(40, 240);
    Test.assert(quadsAreEqual(target._rects, [[5, 205, 45, 245]]));

    // ... or grid items
    target = await Test.getMouseTarget(140, 240);
    Test.assert(quadsAreEqual(target._rects, [[105, 205, 145, 245]]));

    // positioned elements without z-index don't create a stacking context
    target = await Test.getMouseTarget(240, 240);
    Test.assert(quadsAreEqual(target._rects, [[210, 210, 250, 250]]));

    // children of positioned elements are in front of children of unpositioned ones
    target = await Test.getMouseTarget(340, 240);
    Test.assert(quadsAreEqual(target._rects, [[310, 210, 350, 250]]));

    // elements with multiple client rects:
    // all client rects are highlighted
    target = await Test.getMouseTarget(60, 340);
    Test.assert(target._rects.length === 2);
    // clicking inside the element's bounding client rect but outside all of its
    // client rects will not select the element
    target = await Test.getMouseTarget(60, 320);
    Test.assert(quadsAreEqual(target._rects, [[0, 300, 80, 380]]));

    // unpositioned children of elements with overflow will be clipped
    target = await Test.getMouseTarget(140, 340);
    Test.assert(quadsAreEqual(target._rects, [[100, 300, 180, 380]]));
    // ... but the highlighter will show their unclipped size
    target = await Test.getMouseTarget(140, 320);
    Test.assert(quadsAreEqual(target._rects, [[105, 305, 145, 345]]));

    // absolutely positioned elements are not clipped by their unpositioned parent
    target = await Test.getMouseTarget(240, 340);
    Test.assert(quadsAreEqual(target._rects, [[210, 310, 250, 350]]));

    // ... but relatively positioned ones are
    target = await Test.getMouseTarget(340, 340);
    Test.assert(quadsAreEqual(target._rects, [[300, 300, 380, 380]]));
  }
);

function quadsAreEqual(q1, q2) {
  if (q1.length !== q2.length) {
    return false;
  }
  for (let i = 0; i < q1.length; i++) {
    for (let j = 0; j < 4; j++) {
      if (q1[i][j] !== q2[i][j] && q2[i][j] !== null) {
        return false;
      }
    }
  }
  return true;
}

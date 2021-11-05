// This script isn't used by the end-to-end test suite. It is used to support
// randomly exploring recordings with the viewer, for turning up bugs and so forth.
Test.describe(`random walk`, async () => {
  await Test.selectConsole();

  while (true) {
    try {
      await randomAction();
    } catch (e) {
      console.error(e);
    }
    await Test.waitForTime(5000);
  }
});

function pickRandomItem(array) {
  if (!array) {
    return undefined;
  }
  const index = (Math.random() * array.length) | 0;
  return array[index];
}

// Select a random source in the debugger.
async function selectRandomSource() {
  const sources = Test.dbgSelectors.getSourceList();
  const source = pickRandomItem(sources);
  if (source && source.url) {
    return Test.selectSource(source.url);
  }
}

// Add a logpoint to a random position in the selected source.
// Removes any existing logpoints.
async function addRandomLogpoint() {
  await Test.removeAllBreakpoints();

  const source = Test.dbgSelectors.getSelectedSourceWithContent();
  if (!source || !source.url) {
    return;
  }

  const lines = Test.dbgSelectors.getBreakableLines(source.id);
  if (!lines || !lines.length) {
    return;
  }

  const line = pickRandomItem(lines);
  const columns = await Test.dbg.actions.loadSourceActorBreakpointColumns({ id: source.id, line });
  if (!columns || !columns.length) {
    return;
  }

  const column = pickRandomItem(columns);
  return Test.addBreakpoint(source.url, line, column, { logValue: "arguments" });
}

// Jump to a random message in the console.
async function warpToRandomMessage() {
  const messages = document.querySelectorAll(`.webconsole-output .message`);
  const msg = pickRandomItem(messages);
  if (!msg) {
    return;
  }
  const warpButton = msg.querySelector(".rewind") || msg.querySelector(".fast-forward");
  if (!warpButton) {
    return;
  }
  warpButton.click();
  await Test.waitForPaused();
}

// Expand a random scope or object.
async function toggleRandomScopeNode() {
  const nodes = document.querySelectorAll(".scopes-list .node");
  const node = pickRandomItem(nodes);
  if (!node) {
    return;
  }
  const arrow = node.querySelector(".arrow");
  if (!arrow) {
    return;
  }
  arrow.click();
}

// Perform a random action, for use by the random_walk test.
function randomAction() {
  const actions = [
    selectRandomSource,
    addRandomLogpoint,
    warpToRandomMessage,
    toggleRandomScopeNode,
  ];
  const action = pickRandomItem(actions);
  console.log("Random action", action.name);
  return action();
}

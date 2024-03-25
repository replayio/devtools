import { openDevToolsTab, startTest } from "../helpers";
import {
  openFileSearchPanel,
  searchSources,
  selectSourceSearchResult,
} from "../helpers/file-search";
import { getScopesPanel, rewindToLine, selectFrame } from "../helpers/pause-information-panel";
import {
  addBreakpoint,
  closeSource,
  getSelectedLineNumber,
  waitForSourceToBeShown,
} from "../helpers/source-panel";
import { getByTestName, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "doc_rr_blackbox.html" });

test(`source-line-highlights: Test source line highlighting`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  const firstSource = exampleKey;
  const secondSource = "blackbox.js";

  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 16, url: firstSource });
  await rewindToLine(page, 16);

  // the location of the top frame is highlighted
  await waitFor(async () => expect(await getSelectedLineNumber(page, true)).toBe(16));

  // select the second frame
  await selectFrame(page, 1);

  await waitForSourceToBeShown(page, secondSource);
  // the location of the second frame is highlighted
  await waitFor(async () => expect(await getSelectedLineNumber(page, true)).toBe(3));

  // the scopes panel shows one function,
  // clicking it should select its definition in the first source
  const functionDefinitionButton = getByTestName(getScopesPanel(page), "JumpToDefinitionButton");
  await functionDefinitionButton.click();
  await waitForSourceToBeShown(page, firstSource);

  // the selected frame's location is in the other source, so no highlight for that
  expect(await getSelectedLineNumber(page, true)).toBe(null);
  // the function definition is highlighted
  expect(await getSelectedLineNumber(page, false)).toBe(16);

  await closeSource(page, secondSource);

  await openFileSearchPanel(page);
  await searchSources(page, "const");
  await selectSourceSearchResult(page, 0);
  // the first search result is in the second source
  await waitForSourceToBeShown(page, secondSource);
  // the search result is highlighted
  expect(await getSelectedLineNumber(page, true)).toBe(3);
  // the location of the second frame is also still highlighted
  expect(await getSelectedLineNumber(page, false)).toBe(2);
});

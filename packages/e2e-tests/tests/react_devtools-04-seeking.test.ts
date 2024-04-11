import { openDevToolsTab, startTest } from "../helpers";
import {
  getReactComponents,
  jumpToMessageAndCheckComponents,
  verifyReactComponentIsSelected,
  waitForReactComponentCount,
} from "../helpers/new-react-devtools-panel";
import { getTimelineCurrentPercent, seekToTimePercent } from "../helpers/timeline";
import test from "../testFixture";

test.use({ exampleKey: "cra/dist/index.html" });

test("react_devtools-04: Component selection is maintained when seeking to a new point", async ({
  pageWithMeta: { page, recordingId, testScope },
}) => {
  const queryParams = new URLSearchParams();

  await startTest(page, recordingId, testScope, undefined, queryParams);
  await openDevToolsTab(page);

  // Seek to the first console message and check that the initial tree has 3 components
  await jumpToMessageAndCheckComponents(page, "Initial list", 3);

  const initialTimePercent = await getTimelineCurrentPercent(page);

  // Select the root component
  const firstComponent = getReactComponents(page).nth(0);
  await firstComponent.click();
  await verifyReactComponentIsSelected(firstComponent);

  // Seek to the next console message and check that the tree is updated, showing 4 components
  await jumpToMessageAndCheckComponents(page, "Added an entry", 4);
  // Check that the root component is still selected
  await verifyReactComponentIsSelected(firstComponent);

  // Seek back to the time of the first message using the timeline,
  // so that the RDT panel remains visible while seeking
  await seekToTimePercent(page, initialTimePercent);
  // Check that the tree is updated, showing 3 components again
  await waitForReactComponentCount(page, 3);
  // Check that the root component is still selected
  await verifyReactComponentIsSelected(firstComponent);
});

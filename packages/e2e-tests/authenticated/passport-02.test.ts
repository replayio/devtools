import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1_API_KEY } from "../helpers/authentication";
import { showCommentsPanel } from "../helpers/comments";
import { warpToMessage } from "../helpers/console-panel";
import {
  activateInspectorTool,
  inspectCanvasCoordinates,
  openElementsPanel,
  waitForElementsToLoad,
} from "../helpers/elements-panel";
import { findNetworkRequestRow, openNetworkPanel } from "../helpers/network-panel";
import { getReactComponents } from "../helpers/new-react-devtools-panel";
import { openReactDevtoolsPanel } from "../helpers/new-react-devtools-panel";
import { isPassportItemCompleted } from "../helpers/passport";
import { enablePassport } from "../helpers/settings";
import { resetTestUser, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "cra/dist/index.html" });

test(`authenticated/passport-02: Infrared inspection`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await resetTestUser("frontende2e1@replay.io");

  await startTest(page, recordingId, E2E_USER_1_API_KEY);

  await enablePassport(page);

  expect(await isPassportItemCompleted(page, "Inspect UI elements")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Inspect network requests")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Inspect React components")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Jump to code")).toBeFalsy();

  await openDevToolsTab(page);
  await warpToMessage(page, "Added an entry");

  await openElementsPanel(page);
  await waitForElementsToLoad(page);
  await activateInspectorTool(page);
  await inspectCanvasCoordinates(page, 0.05, 0.01);

  // Clicking the canvas will add a comment which can cause timing complications with the passport check below
  // Easiest way to avoid this is to explicitly wait for the comments panel to be shown before continuing
  await showCommentsPanel(page);

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Inspect UI elements")).toBeTruthy()
  );

  await openNetworkPanel(page);
  const networkRequest = await findNetworkRequestRow(page, { name: "index.html" });
  await networkRequest.click();

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Inspect network requests")).toBeTruthy()
  );

  await openReactDevtoolsPanel(page);
  await getReactComponents(page).nth(0).click();

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Inspect React components")).toBeTruthy()
  );

  // TODO add test for the "Jump to code" item.
  // Currently we can't make example recordings containing mouse or keyboard events...
});

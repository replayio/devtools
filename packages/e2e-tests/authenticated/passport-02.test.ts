import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1 } from "../helpers/authentication";
import { warpToMessage } from "../helpers/console-panel";
import {
  findElementCoordinates,
  inspectCanvasCoordinates,
  openElementsPanel,
  waitForElementsToLoad,
} from "../helpers/elements-panel";
import { findNetworkRequestRow, openNetworkPanel } from "../helpers/network-panel";
import { getReactComponents } from "../helpers/new-react-devtools-panel";
import { openReactDevtoolsPanel } from "../helpers/new-react-devtools-panel";
import { isPassportItemCompleted } from "../helpers/passport";
import { enablePassport } from "../helpers/settings";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "cra/dist/index.html", testUsers: [E2E_USER_1] });

test(`authenticated/passport-02: Infrared inspection`, async ({
  pageWithMeta: { page, recordingId, testScope },
  testUsers,
}) => {
  await startTest(page, recordingId, { apiKey: testUsers![0].apiKey, testScope });

  await enablePassport(page);

  expect(await isPassportItemCompleted(page, "Inspect UI elements")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Inspect network requests")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Inspect React components")).toBeFalsy();

  await openDevToolsTab(page);
  await warpToMessage(page, "Added an entry");

  await openElementsPanel(page);
  await waitForElementsToLoad(page);
  const { x, y } = await findElementCoordinates(page, '<div id="root"');
  await inspectCanvasCoordinates(page, x, y);

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
});

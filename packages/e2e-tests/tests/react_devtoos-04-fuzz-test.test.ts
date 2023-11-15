import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import { Store, printStore } from "../helpers/rdt-store";
import { getReactComponents, openReactDevtoolsPanel } from "../helpers/react-devtools-panel";
import { delay } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "rdt-react-versions/dist/index.html" });

const versions = ["15.7.0", "16.14.0", "17.0.2", "18.2.0"];
const messagesToCheck = versions.flatMap(version => [
  `[${version}] Added an entry`,
  `[${version}] Removed an entry`,
]);

test("react_devtools 04: fuzz testing", async ({ pageWithMeta: { page, recordingId } }) => {
  const queryParams = new URLSearchParams();
  // // Force this test to always re-run the RDT (and other) routines
  // // See pref names in packages/shared/user-data/GraphQL/config.ts
  queryParams.set("features", "backend_rerunRoutines");

  await startTest(page, recordingId, undefined, queryParams);
  await openDevToolsTab(page);

  for (const message of messagesToCheck) {
    await warpToMessage(page, message);
    await openReactDevtoolsPanel(page);

    await delay(500);
    // wait for components to load (setup is complete)
    await getReactComponents(page).first().waitFor();

    const [serializedStore, annotations] = (await page.evaluate(`(() => {
      ${printStore}

      return (${evaluateStore})()
    })()`)) as [string, any];

    const replayStore = new Store();
    for (const annotation of annotations) {
      replayStore.onBridgeOperations(annotation.contents.payload);
    }
    const serializedReplayStore = printStore(replayStore);

    expect(serializedStore).toBe(serializedReplayStore);
    expect(serializedReplayStore).toMatchSnapshot({ name: `fuzz test: ${message}` });
  }
});

function evaluateStore() {
  return [printStore((window as any).app.rdt.store), (window as any).app.rdt.annotations];
}

import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import { getReactComponents, openReactDevtoolsPanel } from "../helpers/new-react-devtools-panel";
import { Store, printStore } from "../helpers/rdt-store";
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

    await delay(2000);
    // wait for components to load (setup is complete)
    await getReactComponents(page).first().waitFor();

    await delay(1500);

    const script = `(${evaluatePause})()`.replace("PRINT_STORE_PLACEHOLDER", `(${printStore})`);
    const [serializedStore, allOperations] = (await page.evaluate(script)) as [string, number[][]];
    const filteredOperations = allOperations
      .filter(operations => {
        // The 1st operation here should either be TREE_OP_ADD or TREE_OP_REMOVE_ROOT
        //
        // We want to filter out the TREE_OP_REMOVE_ROOT operations because
        // we want to reconstruct the tree and only care about the addition operations
        return operations[3] != 6;
      })
      // Sort by the root IDs because routine's annotations are sorted as such
      .sort((op1, op2) => op1[1] - op2[1]);

    const replayStore = new Store();
    for (const operation of filteredOperations) {
      replayStore.onBridgeOperations(operation);
    }
    const serializedReplayStore = printStore(replayStore);

    expect(serializedStore).toBe(serializedReplayStore);
    expect(serializedReplayStore).toMatchSnapshot({ name: `fuzz test: ${message}` });
  }
});

async function evaluatePause() {
  return [
    // @ts-ignore
    PRINT_STORE_PLACEHOLDER((window as any).app.rdt.store),
    await (window as any).app.rdt.generateNewOperationsArrays(),
  ];
}

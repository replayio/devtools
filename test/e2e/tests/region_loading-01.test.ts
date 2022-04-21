import { runClassicTest } from "../runTest";

it("Unloading a region should suppress logpoint results.", async () => {
  await runClassicTest({
    example: "doc_rr_region_loading.html",
    script: "region_loading-01.js",
  });
});

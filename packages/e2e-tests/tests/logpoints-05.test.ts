import { openDevToolsTab, startTest } from "../helpers";
import {
  addLogpoint,
  editLogPoint,
  verifyLogPointContentTypeAheadSuggestions,
} from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "log_points_and_block_scope.html" });

test(`logpoints-05: should auto-complete based on log point location`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await addLogpoint(page, { lineNumber: 5, url: exampleKey });
  await addLogpoint(page, { lineNumber: 12, url: exampleKey });
  await addLogpoint(page, { lineNumber: 17, url: exampleKey });

  // Verify different auto-complete options based on location
  await editLogPoint(page, {
    content: "array",
    lineNumber: 5,
    saveAfterEdit: false,
    url: exampleKey,
  });
  await verifyLogPointContentTypeAheadSuggestions(page, ["arrayGlobal", "Array", "ArrayBuffer"]);

  await editLogPoint(page, {
    content: "array",
    lineNumber: 12,
    saveAfterEdit: false,
    url: exampleKey,
  });
  await verifyLogPointContentTypeAheadSuggestions(page, [
    "arrayBlockOne",
    "arrayBlockOuter",
    "arrayGlobal",
    "Array",
    "ArrayBuffer",
  ]);

  await editLogPoint(page, {
    content: "array",
    lineNumber: 17,
    saveAfterEdit: false,
    url: exampleKey,
  });
  await verifyLogPointContentTypeAheadSuggestions(page, [
    "arrayBlockOuter",
    "arrayBlockTwo",
    "arrayGlobal",
    "Array",
    "ArrayBuffer",
  ]);

  // Alpha sorting should impact priority
  await editLogPoint(page, {
    content: "Array",
    lineNumber: 5,
    saveAfterEdit: false,
    url: exampleKey,
  });
  await verifyLogPointContentTypeAheadSuggestions(page, ["Array", "ArrayBuffer", "arrayGlobal"]);

  await editLogPoint(page, {
    content: "Array",
    lineNumber: 12,
    saveAfterEdit: false,
    url: exampleKey,
  });
  await verifyLogPointContentTypeAheadSuggestions(page, [
    "Array",
    "ArrayBuffer",
    "arrayBlockOne",
    "arrayBlockOuter",
    "arrayGlobal",
  ]);

  await editLogPoint(page, {
    content: "Array",
    lineNumber: 17,
    saveAfterEdit: false,
    url: exampleKey,
  });
  await verifyLogPointContentTypeAheadSuggestions(page, [
    "Array",
    "ArrayBuffer",
    "arrayBlockOuter",
    "arrayBlockTwo",
    "arrayGlobal",
  ]);
});

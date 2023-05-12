import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { addLogpoint, editLogPoint, verifyLogPointPanelContent } from "../helpers/source-panel";

const url = "doc_rr_basic.html";
const lineNumber = 20;

test(`logpoints-09: should support pending edits`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await addLogpoint(page, {
    content: '"initial"',
    lineNumber,
    url,
  });
  await verifyLogPointPanelContent(page, {
    badge: null,
    content: '"initial"',
    lineNumber,
    url,
  });

  // Edit badge; should not impact content or conditional
  await editLogPoint(page, {
    badge: "purple",
    lineNumber,
    saveAfterEdit: false,
    url,
  });
  await verifyLogPointPanelContent(page, {
    badge: "purple",
    content: '"initial"',
    lineNumber,
    url,
  });

  // Edit content; should not impact badge or conditional
  await editLogPoint(page, {
    content: '"new"',
    lineNumber,
    saveAfterEdit: false,
    url,
  });
  await verifyLogPointPanelContent(page, {
    badge: "purple",
    content: '"new"',
    lineNumber,
    url,
  });

  // Edit badge; should not impact content or conditional
  debugger;
  await editLogPoint(page, {
    badge: "orange",
    lineNumber,
    saveAfterEdit: false,
    url,
  });
  await verifyLogPointPanelContent(page, {
    badge: "orange",
    content: '"new"',
    lineNumber,
    url,
  });

  // Edit conditional; should not impact badge or content
  await editLogPoint(page, {
    condition: "true",
    lineNumber,
    saveAfterEdit: false,
    url,
  });
  await verifyLogPointPanelContent(page, {
    badge: "orange",
    condition: "true",
    content: '"new"',
    lineNumber,
    url,
  });

  // Edit badge; should not impact conditional or content
  await editLogPoint(page, {
    badge: "yellow",
    lineNumber,
    saveAfterEdit: false,
    url,
  });
  await verifyLogPointPanelContent(page, {
    badge: "yellow",
    condition: "true",
    content: '"new"',
    lineNumber,
    url,
  });

  // Saving should update
  await editLogPoint(page, {
    lineNumber,
    saveAfterEdit: true,
    url,
  });
});

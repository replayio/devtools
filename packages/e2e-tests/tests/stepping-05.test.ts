import { openDevToolsTab, startTest } from "../helpers";
import {
  addEventListenerLogpoints,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";
import {
  resumeToLine,
  rewindToLine,
  stepInToLine,
  stepOutToLine,
  stepOverToLine,
} from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_minified.html" });

test(`stepping-05: Test stepping in pretty-printed code`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  page.setDefaultTimeout(120000);
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await addBreakpoint(page, { url: "bundle_input.js", lineNumber: 4 });
  await rewindToLine(page, 4);
  await stepInToLine(page, 2);

  // Add a breakpoint in doc_minified.html and resume to there
  await addBreakpoint(page, { url: exampleKey, lineNumber: 8 });
  await resumeToLine(page, 8); // [ document ].getElementById("divvy").click()
  await stepOverToLine(page, 8); // document.[ getElementById("divvy") ].click()
  await stepOverToLine(page, 8); // document.getElementById("divvy").[ click() ]
  await stepOverToLine(page, 9); // [ window ].setTimeout(recordingFinished)
  await stepOverToLine(page, 9); // window.[ setTimeout(recordingFinished) ]
  await stepOverToLine(page, 10); // [ }) ]

  // Step around in bundle_input.js
  await openConsolePanel(page);
  await addEventListenerLogpoints(page, [{ eventType: "click", categoryKey: "mouse" }]);
  await warpToMessage(page, "(click)", 15); // [ n = new DOMEvent(n, s ].getWindow()), !1 === nf.call(s, n)
  await stepInToLine(page, 15); // n = new DOMEvent(n, s.[ getWindow()), !1 ] === nf.call(s, n)
  await stepInToLine(page, 2); // getWindow: () => [ window ]
  await stepOutToLine(page, 15); // n = new DOMEvent(n, s.getWindow()), !1 [ === nf ].call(s, n)
  await stepInToLine(page, 15); // n = new DOMEvent(n, s.getWindow()), !1 === nf.[ call(s, n) ]
  await stepInToLine(page, 6); // [ this ].getElementById("divvy").innerHTML = "Done!"
  await stepOutToLine(page, 16); // [ } ]

  // Step back out to doc_minified.html
  await stepInToLine(page, 9); // [ window ].setTimeout(recordingFinished)
});

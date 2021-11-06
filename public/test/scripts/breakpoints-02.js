// Test.describe(`Test unhandled divergence while evaluating at a breakpoint.`, async () => {
//   await Test.addBreakpoint("doc_rr_basic.html", 21);

//   await Test.rewindToLine(21);
//   await Test.checkEvaluateInTopFrame("number", 10);
//   await Test.checkEvaluateInTopFrame("dump(3)", `"Error: Evaluation failed"`);
//   await Test.checkEvaluateInTopFrame("number", 10);
//   await Test.checkEvaluateInTopFrame("dump(3)", `"Error: Evaluation failed"`);
//   await Test.checkEvaluateInTopFrame("number", 10);
//   await Test.checkEvaluateInTopFrame("testStepping2()", undefined);
// });

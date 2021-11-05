// Test hitting breakpoints when using tricky control flow constructs:
Test.describe(`catch, finally, generators, and async/await.`, async () => {
  await Test.rewindToLine(84);
  await resumeToBreakpoint(10);
  await resumeToBreakpoint(12);
  await resumeToBreakpoint(18);
  await resumeToBreakpoint(20);
  await resumeToBreakpoint(32);
  await resumeToBreakpoint(27);
  await Test.resumeToLine(32);
  await Test.resumeToLine(27);
  await resumeToBreakpoint(42);
  await resumeToBreakpoint(44);
  await resumeToBreakpoint(50);
  await resumeToBreakpoint(54);
  await resumeToBreakpoint(65);
  await resumeToBreakpoint(72);

  async function rewindToBreakpoint(line) {
    await Test.addBreakpoint("control_flow.js", line);
    await Test.rewindToLine(line);
  }

  async function resumeToBreakpoint(line) {
    await Test.addBreakpoint("control_flow.js", line);
    await Test.resumeToLine(line);
  }
});

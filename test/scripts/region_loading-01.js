// Test region unloading/loading by checking output of logpoints.
Test.describe(
  `Unloading a region should suppress logpoint results.`,
  async () => {
    const { assert } = Test;

    const loadTimerange = [0, 5000];
    // Unload 90% of the recording.
    const unloadTimerange = [0, (loadTimerange[1] * 0.9)|0];
    const totalMessageCount = 50;

    await Test.selectSource("doc_rr_region_loading.html");
    await Test.addBreakpoint("doc_rr_region_loading.html", 20, undefined, {
      logValue: `"Part1Logpoint Number " + number`,
    });

    await Test.selectConsole();
    let messages = await Test.waitForMessageCount("Part1Logpoint", totalMessageCount);
    assert(!Test.findMessages("Loading").length, "No loading messages should be left.");
    assert(messages.length == totalMessageCount, "Should have gotten all expected logpoing messages.");
    await Test.removeAllBreakpoints();

    // Unload a region of the recording 1 second in, 2 seconds in duration.
    await Test.unloadRegion(...unloadTimerange);

    await Test.addBreakpoint("doc_rr_region_loading.html", 20, undefined, {
      logValue: `"Part2Logpoint Number " + number`,
    });

    // Wait until we see "Loading..." messages.
    await Test.waitUntil(() => Test.findMessages("Loading").length > 0);

    // Then wait until they all go away.
    await Test.waitUntil(() => Test.findMessages("Loading").length === 0);

    // Then count the number of "Part2Logpoint" messages.
    messages = Test.findMessages("Part2Logpoint");
    assert(messages.length >= 1, "Should have gotten at least one logpoint message.");
    assert(messages.length < totalMessageCount, "Should have lost at least one logpoint message.");
    await Test.removeAllBreakpoints();

    // Reload the unloaded region.
    await Test.loadRegion(...unloadTimerange);

    await Test.addBreakpoint("doc_rr_region_loading.html", 20, undefined, {
      logValue: `"Part3Logpoint Number " + number`,
    });
    messages = await Test.waitForMessageCount("Part3Logpoint", totalMessageCount);
  }
);

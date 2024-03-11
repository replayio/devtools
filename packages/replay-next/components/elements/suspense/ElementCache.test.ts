import { ObjectId, PauseId } from "@replayio/protocol";

import { elementCache } from "replay-next/components/elements/suspense/ElementCache";
import { createMockReplayClient } from "replay-next/components/elements/utils/tests";
import { ReplayClientInterface } from "shared/client/types";

describe("ElementCache", () => {
  let pauseId: PauseId;
  let replayClient: ReplayClientInterface;
  let rootNodeId: ObjectId;

  function startTest(htmlString: string) {
    pauseId = "faux-pause-id";

    const data = createMockReplayClient(htmlString);
    replayClient = data.replayClient;
    rootNodeId = data.rootNodeId;
  }

  it("should pre-filter children when requested", async () => {
    startTest(`
    <html>
      <head></head>
      <body></body>
    </html>
    `);

    const rootElement = await elementCache.readAsync(replayClient, pauseId, rootNodeId);
    expect(rootElement.filteredChildNodeIds).toHaveLength(1);
    const htmlNodeId = rootElement.filteredChildNodeIds[0];

    // childNodes contains an empty #text node
    // filteredChildNodeIds should not
    const htmlElement = await elementCache.readAsync(replayClient, pauseId, htmlNodeId);
    expect(htmlElement.node.childNodes).toMatchInlineSnapshot(`
        Array [
          "3",
          "4",
          "5",
        ]
      `);
    expect(htmlElement.filteredChildNodeIds).toMatchInlineSnapshot(`
        Array [
          "3",
          "5",
        ]
      `);
  });
});

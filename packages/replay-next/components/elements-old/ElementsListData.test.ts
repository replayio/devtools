import { ObjectId, PauseId } from "@replayio/protocol";

import type {
  ElementsListData,
  ElementsListData as ElementsListDataType,
} from "replay-next/components/elements-old/ElementsListData";
import {
  IdToMockDataMap,
  createMockReplayClient,
} from "replay-next/components/elements-old/utils/tests";
import { MockReplayClientInterface } from "replay-next/src/utils/testing";
import { ReplayClientInterface } from "shared/client/types";

describe("ElementsListData", () => {
  let ElementsListData: new (
    replayClient: ReplayClientInterface,
    pauseId: PauseId
  ) => ElementsListDataType;
  let listData: ElementsListData;
  let mockObjectWithPreviewData: IdToMockDataMap;
  let mockReplayClient: MockReplayClientInterface;
  let rootNodeId: ObjectId;

  function startTest(htmlString: string) {
    const data = createMockReplayClient(htmlString);
    mockObjectWithPreviewData = data.mockObjectWithPreviewData;
    mockReplayClient = data.replayClient;
    rootNodeId = data.rootNodeId;

    listData = new ElementsListData(mockReplayClient, "pause") as ElementsListDataType;
  }

  async function toggleNodeExpanded(index: number, expanded: boolean) {
    const item = listData.getItemAtIndex(index);
    await listData.toggleNodeExpanded(item.id, expanded);
  }

  function waitForInvalidation() {
    const prevRevision = listData.getRevision();

    // Wait for the path of nodes to load and expand
    // but not for the full tree data to be loaded
    return new Promise<void>(resolve => {
      const unsubscribe = listData.subscribeToInvalidation(() => {
        const nextRevision = listData.getRevision();

        if (prevRevision !== nextRevision) {
          resolve();
          unsubscribe();
        }
      });
    });
  }

  afterEach(() => {
    jest.resetModules();
  });

  beforeEach(() => {
    // Modules should be reset between tests so that stale cache data from one test doesn't interfere with another
    const module = require("replay-next/components/elements-old/ElementsListData");
    ElementsListData = module.ElementsListData;
  });

  it("should load a simple document tree", async () => {
    startTest(
      `
    <html>
      <head></head>
      <body></body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 2);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body />
      </html>"
    `);
  });

  it("should properly parse comments", async () => {
    startTest(
      `
    <html>
      <body>
        <!-- Single line comment -->
        <!--
          Multi-line
          comment
        -->
      </body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 4);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <!-- Single line comment -->
          <!-- Multi-line comment -->
        </body>
      </html>"
    `);
  });

  it("should properly parse iframes and contents", async () => {
    const encoded = encodeURIComponent("<html><body><div>This is a div</div></body></html>");
    startTest(
      `
    <html>
      <body>
        <iframe src="data:text/html,${encoded}"></iframe>
      </body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 10);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <iframe>
            #document
              <html>
                <head />
                <body>
                  <div>
                    This is a div
                  </div>
                </body>
              </html>
          </iframe>
        </body>
      </html>"
    `);
  });

  it("should be able to (re)load already cached data (to support HMR)", async () => {
    startTest(
      `
    <html>
      <head></head>
      <body></body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 2);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body />
      </html>"
    `);

    listData = new ElementsListData(mockReplayClient, "pause") as ElementsListDataType;
    await listData.registerRootNodeId(rootNodeId, 2);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body />
      </html>"
    `);
  });

  it("should gradually load nested items when expanded", async () => {
    startTest(
      `
    <html>
      <head>
        <script type="text/javascript">
          // Line of text
        </script>
        <link rel="stylesheet" href="index.css" />
      </head>
      <body>
        <ul>
          <li>Thing one</li>
          <li>Thing two</li>
        </ul>
      </body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 2);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>…</head>
        <body>…</body>
      </html>"
    `);

    await toggleNodeExpanded(1, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>
          <script>…</script> *
          <link />
        </head>
        <body>…</body>
      </html>"
    `);

    await toggleNodeExpanded(2, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>
          <script>
            // Line of text
          </script>
          <link />
        </head>
        <body>…</body>
      </html>"
    `);

    await toggleNodeExpanded(1, false);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>…</head>
        <body>…</body>
      </html>"
    `);

    await toggleNodeExpanded(2, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>…</head>
        <body>
          <ul>…</ul> *
        </body>
      </html>"
    `);

    await toggleNodeExpanded(3, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>…</head>
        <body>
          <ul>
            <li>…</li> *
            <li>…</li> *
          </ul>
        </body>
      </html>"
    `);

    await toggleNodeExpanded(4, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>…</head>
        <body>
          <ul>
            <li>
              Thing one
            </li>
            <li>…</li> *
          </ul>
        </body>
      </html>"
    `);
  });

  it("should display a loading indicator while data is being loaded", async () => {
    startTest(
      `
    <html>
      <head></head>
      <body>
        <div />
        <div />
      </body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 1);
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);

    const htmlPromise = toggleNodeExpanded(0, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>…</body> *
      </html>"
    `);

    const bodyPromise = toggleNodeExpanded(2, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          Loading…
        </body>
      </html>"
    `);

    await Promise.all([htmlPromise, bodyPromise]);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <div />
          <div />
        </body>
      </html>"
    `);
  });

  it("should display multiple loading indicators while multiple subtrees are being loaded", async () => {
    startTest(
      `
    <html>
      <head>
        <script>
          // Text
        </script>
      </head>
      <body>
        <div>Text</div>
        <div>Text</div>
      </body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 1);
    await toggleNodeExpanded(0, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>…</head> *
        <body>…</body> *
      </html>"
    `);

    const headPromise = toggleNodeExpanded(1, true);
    const bodyPromise = toggleNodeExpanded(4, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>
          Loading…
        </head>
        <body>
          Loading…
        </body>
      </html>"
    `);

    await Promise.all([headPromise, bodyPromise]);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>
          <script>…</script> *
        </head>
        <body>
          <div>…</div> *
          <div>…</div> *
        </body>
      </html>"
    `);

    const scriptPromise = toggleNodeExpanded(2, true);
    const divPromise = toggleNodeExpanded(7, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>
          <script>
            Loading…
          </script>
        </head>
        <body>
          <div>
            Loading…
          </div>
          <div>…</div> *
        </body>
      </html>"
    `);

    await Promise.all([scriptPromise, divPromise]);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>
          <script>
            // Text
          </script>
        </head>
        <body>
          <div>
            Text
          </div>
          <div>…</div> *
        </body>
      </html>"
    `);
  });

  it("should support collapsing a subtree that is being loaded", async () => {
    startTest(
      `
    <html>
      <head></head>
      <body>
        <div />
      </body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 1);
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);

    const expandPromise = toggleNodeExpanded(0, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>…</body> *
      </html>"
    `);

    const collapsePromise = toggleNodeExpanded(0, false);
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);

    await expandPromise;
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);

    await collapsePromise;
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);
  });

  it("should expand a path to an already loaded node", async () => {
    startTest(
      `
    <html>
      <head />
      <body>
        <ul>
          <li>Thing one</li>
          <li>Thing two</li>
        </ul>
      </body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 10);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <ul>
            <li>
              Thing one
            </li>
            <li>
              Thing two
            </li>
          </ul>
        </body>
      </html>"
    `);

    await toggleNodeExpanded(3, false);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <ul>…</ul>
        </body>
      </html>"
    `);

    await toggleNodeExpanded(0, false);
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);

    await listData.loadPathToNode("15");
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <ul>
            <li>
              Thing one
            </li>
            <li>
              Thing two
            </li>
          </ul>
        </body>
      </html>"
    `);
  });

  it("should load and expand a path to a node within an unloaded subtree", async () => {
    startTest(
      `
    <html>
      <head />
      <body>
        <ul>
          <li>Thing one</li>
          <li>Thing two</li>
        </ul>
      </body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 1);
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);

    const loadedPromise = listData.loadPathToNode("15");
    await waitForInvalidation();
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          Loading…
        </body>
      </html>"
    `);

    await loadedPromise;
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <ul>
            <li>…</li> *
            <li>
              Thing two
            </li>
          </ul>
        </body>
      </html>"
    `);
  });

  it("should load and expand multiple subtrees in parallel", async () => {
    startTest(
      `
    <html>
      <head />
      <body>
        <ul>
          <li>Thing one</li>
          <li>Thing two</li>
        </ul>
        <table>
          <tr>
            <td>One</td>
            <td>Two</td>
          </tr>
        </table>
      </body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 1);
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);

    const liPromise = listData.loadPathToNode("14"); // ul > li > "Thing two"
    await waitForInvalidation();
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          Loading…
        </body>
      </html>"
    `);

    const tdPromise = listData.loadPathToNode("27"); // table > tr > td > "One"
    await waitForInvalidation();
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          Loading…
        </body>
      </html>"
    `);

    await liPromise;
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <ul>
            <li>…</li> *
            <li>
              Thing two
            </li>
          </ul>
          <table>…</table> *
        </body>
      </html>"
    `);

    await tdPromise;
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <ul>
            <li>…</li> *
            <li>
              Thing two
            </li>
          </ul>
          <table>
            <tbody>
              <tr>
                <td>
                  One
                </td>
                <td>…</td> *
              </tr>
            </tbody>
          </table>
        </body>
      </html>"
    `);
  });

  it("should allow a node to be collapsed while the path to a leaf node is being loaded", async () => {
    startTest(
      `
    <html>
      <head />
      <body>
        <ul>
          <li>Thing one</li>
          <li>Thing two</li>
        </ul>
      </body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 1);
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);

    const loadedPromise = listData.loadPathToNode("15");
    await waitForInvalidation();
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          Loading…
        </body>
      </html>"
    `);

    await toggleNodeExpanded(0, false);
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);

    await loadedPromise;
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);

    await toggleNodeExpanded(0, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <ul>
            <li>…</li> *
            <li>
              Thing two
            </li>
          </ul>
        </body>
      </html>"
    `);
  });

  it("should report an error loading a subtree", async () => {
    startTest(
      `
    <html>
      <head></head>
      <body></body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 0);
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html> *"`);

    jest.spyOn(console, "error").mockImplementation(() => {});

    // <head> and <body> and #text nodes
    delete mockObjectWithPreviewData[3];
    delete mockObjectWithPreviewData[4];
    delete mockObjectWithPreviewData[5];
    delete mockObjectWithPreviewData[6];

    await toggleNodeExpanded(0, true);

    expect(listData.didError()).toBe(true);
    expect(listData.getItemCount()).toBe(0);
  });

  it("should report an error loading a path to a leaf node", async () => {
    startTest(
      `
    <html>
      <head></head>
      <body></body>
    </html>
    `
    );

    await listData.registerRootNodeId(rootNodeId, 0);
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html> *"`);

    jest.spyOn(console, "error").mockImplementation(() => {});

    await listData.loadPathToNode("12345");
    expect(listData.didError()).toBe(true);
    expect(listData.getItemCount()).toBe(0);
  });
});

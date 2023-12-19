import assert from "assert";

import { ElementsListData } from "replay-next/components/elements-new/ElementsListData";
import {
  deserializeDOM,
  serializeDOM,
} from "replay-next/components/elements-new/utils/serialization";
import { createMockReplayClient } from "replay-next/src/utils/testing";

describe("ElementsListData", () => {
  let listData: ElementsListData;

  async function startTest(htmlString: string, rootModifier?: (rootDOMNode: Document) => void) {
    // Self terminated tags aren't parsed correctly
    htmlString = htmlString.replace(/<([^\>]+)\s{0,1}\/\>/g, "<$1></$1>");

    document.write(htmlString);

    if (rootModifier) {
      rootModifier(document);
    }

    const serialized = serializeDOM(document);
    const rootNode = deserializeDOM(serialized);
    assert(rootNode !== null);

    listData = new ElementsListData(createMockReplayClient(), "pause", rootNode);
  }

  function toggleNodeExpanded(index: number, expanded: boolean) {
    const item = listData.getItemAtIndex(index);
    listData.toggleNodeExpanded(item.objectId, expanded);
  }

  afterEach(() => {
    jest.resetModules();

    // @ts-expect-error
    delete window.__RECORD_REPLAY_ARGUMENTS__;
  });

  beforeEach(() => {
    let fakeObjectId = 0;
    let fakeObjectMap = new Map();

    // @ts-expect-error
    window.__RECORD_REPLAY_ARGUMENTS__ = {
      internal: {
        registerPlainObject: (value: any) => {
          if (!fakeObjectMap.has(value)) {
            fakeObjectMap.set(value, ++fakeObjectId);
          }
          return fakeObjectMap.get(value);
        },
      },
    };
  });

  it("should be return a parent item", async () => {
    startTest(
      `
    <html>
      <head></head>
      <body>
        <script />
        <div>
          <main>
            <h1>Text</h1>
          </main>
        </div>
      </body>
    </html>
    `
    );

    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <script />
          <div>
            <main>
              <h1>
                Text
              </h1>
            </main>
          </div>
        </body>
      </html>"
    `);

    let item = listData.getItemAtIndex(6);
    expect(item.tagName).toBe("h1");

    item = listData.getParentItem(item);
    expect(item.tagName).toBe("main");

    item = listData.getParentItem(item);
    expect(item.tagName).toBe("div");

    item = listData.getParentItem(item);
    expect(item.tagName).toBe("body");

    item = listData.getParentItem(item);
    expect(item.tagName).toBe("html");
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

    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body />
      </html>"
    `);
  });

  it("should properly parse iframes and contents", async () => {
    startTest(
      `
    <html>
      <body>
        <iframe />
      </body>
    </html>
    `,
      rootDOMNode => {
        // JSDom doesn't support srcdoc
        // See github.com/jsdom/jsdom/issues/1892htmlStringToElements(
        rootDOMNode.querySelector("iframe")!.contentDocument!.write(
          `
          <html>
            <body>
              <div>This is a div</div>
            </body>
          </html>
        `
        );
      }
    );

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

    // Verify a collapsed #document node works okay (special tail logic)
    toggleNodeExpanded(4, false);
    expect(listData.toString()).toMatchInlineSnapshot(`
          "<html>
            <head />
            <body>
              <iframe>
                #document
              </iframe>
            </body>
          </html>"
      `);

    toggleNodeExpanded(4, true);
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

  it("should support collapsing and expanding nodes", async () => {
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

    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>…</head>
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

    // Expand <head>
    let id = listData.getItemAtIndex(1).objectId;
    listData.toggleNodeExpanded(id, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>
          <script type=\\"text/javascript\\">
            // Line of text
          </script>
          <link href=\\"index.css\\" rel=\\"stylesheet\\" />
        </head>
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

    // Collapse <ul>
    id = listData.getItemAtIndex(8).objectId;
    listData.toggleNodeExpanded(id, false);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>
          <script type=\\"text/javascript\\">
            // Line of text
          </script>
          <link href=\\"index.css\\" rel=\\"stylesheet\\" />
        </head>
        <body>
          <ul>…</ul>
        </body>
      </html>"
    `);

    // Collapse <body>
    id = listData.getItemAtIndex(7).objectId;
    listData.toggleNodeExpanded(id, false);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>
          <script type=\\"text/javascript\\">
            // Line of text
          </script>
          <link href=\\"index.css\\" rel=\\"stylesheet\\" />
        </head>
        <body>…</body>
      </html>"
    `);

    // Expand <body>
    id = listData.getItemAtIndex(7).objectId;
    listData.toggleNodeExpanded(id, true);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head>
          <script type=\\"text/javascript\\">
            // Line of text
          </script>
          <link href=\\"index.css\\" rel=\\"stylesheet\\" />
        </head>
        <body>
          <ul>…</ul>
        </body>
      </html>"
    `);
  });

  it("should expand the path to a selected node", async () => {
    startTest(
      `
    <html>
      <head />
      <body>
        <div id="target" />
      </body>
    </html>
    `
    );
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <div id=\\"target\\" />
        </body>
      </html>"
    `);

    const targetId = listData.getItemAtIndex(3).objectId;

    // Collapse <ul> and <body>
    listData.toggleNodeExpanded(listData.getItemAtIndex(2).objectId, false);
    listData.toggleNodeExpanded(listData.getItemAtIndex(0).objectId, false);
    expect(listData.toString()).toMatchInlineSnapshot(`"<html>…</html>"`);

    listData.selectNode(targetId);
    expect(listData.toString()).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <div id=\\"target\\" />
        </body>
      </html>"
    `);
  });

  describe("search", () => {
    it("should match both head and tail tag names", async () => {
      startTest(
        `
      <html>
        <head>
          <script type="text/javascript"></script>
          <link rel="stylesheet" href="index.css" />
        </head>
        <body>
          <ul>
            <li>Item</li>
            <li />
          </ul>
        </body>
      </html>
      `
      );

      expect(listData.toString()).toMatchInlineSnapshot(`
        "<html>
          <head>…</head>
          <body>
            <ul>
              <li>
                Item
              </li>
              <li />
            </ul>
          </body>
        </html>"
      `);

      expect(listData.search("li")).toEqual([4, 6, 7]);
      expect(listData.search("<li")).toEqual([4, 7]);
      expect(listData.search("<li>")).toEqual([4]);
      expect(listData.search("</li>")).toEqual([6]);
      expect(listData.search("<li />")).toEqual([7]);

      // Basic search does not support advanced search syntax
      expect(listData.search('[rel="stylesheet"]')).toEqual([]);
    });

    it("should match attributes and values", async () => {
      startTest(
        `
      <html>
        <head>
          <script type="text/javascript"></script>
          <link rel="stylesheet" href="index.css" />
        </head>
        <body />
      </html>
      `
      );

      const headId = listData.getItemAtIndex(1).objectId;
      listData.toggleNodeExpanded(headId, true);

      expect(listData.toString()).toMatchInlineSnapshot(`
        "<html>
          <head>
            <script type=\\"text/javascript\\" />
            <link href=\\"index.css\\" rel=\\"stylesheet\\" />
          </head>
          <body />
        </html>"
      `);

      expect(listData.search("type")).toEqual([2]);
      expect(listData.search('"text/javascript"')).toEqual([2]);
      expect(listData.search('type="text/javascript"')).toEqual([2]);
      expect(listData.search('<script type="text/javascript"')).toEqual([2]);
      expect(listData.search('" rel="stylesheet')).toEqual([3]);
    });
  });
});

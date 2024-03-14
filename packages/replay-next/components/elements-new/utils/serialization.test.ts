import { ElementsListData } from "replay-next/components/elements-new/ElementsListData";
import { Node } from "replay-next/components/elements-new/types";
import {
  deserializeDOM,
  serializeDOM,
} from "replay-next/components/elements-new/utils/serialization";
import { createMockReplayClient } from "replay-next/src/utils/testing";

describe("serializeDOM", () => {
  let listData: ElementsListData;

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

  afterEach(() => {
    // @ts-expect-error
    delete window.__RECORD_REPLAY_ARGUMENTS__;
  });

  function htmlStringToElements(html: string, rootDOMNode = document) {
    // Self terminated tags aren't parsed correctly
    html = html.replace(/<([^\>]+)\s{0,1}\/\>/g, "<$1></$1>");

    rootDOMNode.write(html);

    // JSDom doesn't support srcdoc
    // See github.com/jsdom/jsdom/issues/1892

    return rootDOMNode;
  }

  function rootNodeToString(rootNode: Node): string {
    // ElementsListData serializes our nested objects into a string.
    // Using it makes the inline snapshots prettier.
    listData = new ElementsListData(createMockReplayClient(), "fake", rootNode);

    return "" + listData;
  }

  function parseDOM(html: string, rootModifier?: (rootDOMNode: Document) => void) {
    const rootDOMNode = htmlStringToElements(html);

    if (rootModifier) {
      rootModifier(rootDOMNode);
    }

    const rawData = serializeDOM(rootDOMNode);
    const rootNode = deserializeDOM(rawData);

    return rootNode ? rootNodeToString(rootNode) : "";
  }

  describe("serialization", () => {
    it("should support id and class name attributes", () => {
      expect(
        parseDOM(`
      <ul class="List">
        <li class="ListItem Empty" />
        <li class="ListItem">
          <button id="Button">
            Click me
          </button>
        </li>
      </ul>
    `)
      ).toMatchInlineSnapshot(`
        "<html>
          <head />
          <body>
            <ul class=\\"List\\">
              <li class=\\"ListItem Empty\\" />
              <li class=\\"ListItem\\">
                <button id=\\"Button\\">
                  Click me
                </button>
              </li>
            </ul>
          </body>
        </html>"
      `);
    });

    it('should support "href" attributes for <link> tags and "src" attributes for <script> tags', () => {
      // The <head> element is collapsed by default
      expect(
        parseDOM(`
      <html>
        <head>
          <link rel="stylesheet" href="https://example.com/style.css" />
          <script src="https://example.com/script.js" />
        </head>
        <body>
          <a href="https://example.com" />
        </body>
      </html>
    `)
      ).toMatchInlineSnapshot(`
        "<html>
          <head>…</head>
          <body>
            <a href=\\"https://example.com\\" />
          </body>
        </html>"
      `);

      const id = listData.getItemAtIndex(1).objectId;
      listData.toggleNodeExpanded(id, true);

      expect(listData.toString()).toMatchInlineSnapshot(`
        "<html>
          <head>
            <link href=\\"https://example.com/style.css\\" rel=\\"stylesheet\\" />
            <script src=\\"https://example.com/script.js\\" />
          </head>
          <body>
            <a href=\\"https://example.com\\" />
          </body>
        </html>"
      `);
    });

    it("should support data attributes", () => {
      expect(
        parseDOM(`
      <div data-test-id="Foo" data-test-name="bar" />
    `)
      ).toMatchInlineSnapshot(`
        "<html>
          <head />
          <body>
            <div data-test-id=\\"Foo\\" data-test-name=\\"bar\\" />
          </body>
        </html>"
      `);
    });

    it("should ignore other attributes", () => {
      expect(
        parseDOM(`
      <div style="position: absolute" />
    `)
      ).toMatchInlineSnapshot(`
        "<html>
          <head />
          <body>
            <div style=\\"position: absolute\\" />
          </body>
        </html>"
      `);
    });

    it("should support iframes", () => {
      expect(
        parseDOM("<iframe />", rootDOMNode => {
          // JSDom doesn't support srcdoc
          // See github.com/jsdom/jsdom/issues/1892htmlStringToElements(
          htmlStringToElements(
            "<p>Hello World!</p>",
            rootDOMNode.querySelector("iframe")!.contentDocument!
          );
        })
      ).toMatchInlineSnapshot(`
        "<html>
          <head />
          <body>
            <iframe>
              #document
                <html>
                  <head />
                  <body>
                    <p>
                      Hello World!
                    </p>
                  </body>
                </html>
            </iframe>
          </body>
        </html>"
      `);
    });

    it("should filter comment", () => {
      expect(
        parseDOM(`
          <!-- This comment should not be visible -->
          <div>
            <!-- This comment should not be visible -->
            <span>This text should not be visible</span>
          </div>
        `)
      ).toMatchInlineSnapshot(`
        "<html>
          <head />
          <body>
            <div>
              <span>
                This text should not be visible
              </span>
            </div>
          </body>
        </html>"
      `);
    });
  });
});

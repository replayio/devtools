import parseMarkdownString from "../../parseMarkdownString";
import parseTipTapJson from "../../parseTipTapJson";
import rangesToHtml from "../../rangesToHtml";

function assert(json: any, expectedHtml: string) {
  const markdown = parseTipTapJson(json);
  const ranges = parseMarkdownString(markdown);
  const actualHtml = rangesToHtml(ranges);
  expect(actualHtml).toBe(expectedHtml);
}

describe("parseTipTapJson", () => {
  test("imports styled text", async () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              marks: [
                {
                  type: "bold",
                },
              ],
              text: "bold 1",
            },
            {
              type: "hardBreak",
            },
            {
              type: "text",
              marks: [
                {
                  type: "bold",
                },
              ],
              text: "bold 2",
            },
            {
              type: "hardBreak",
            },
            {
              type: "text",
              marks: [
                {
                  type: "italic",
                },
              ],
              text: "italic 1",
            },
            {
              type: "hardBreak",
            },
            {
              type: "text",
              marks: [
                {
                  type: "italic",
                },
              ],
              text: "italic 1",
            },
            {
              type: "hardBreak",
            },
            {
              type: "text",
              marks: [
                {
                  type: "bold",
                },
                {
                  type: "italic",
                },
              ],
              text: "bold+italic",
            },
            {
              type: "hardBreak",
            },
            {
              type: "text",
              text: "regular",
            },
          ],
        },
      ],
    };

    assert(
      json,
      "<strong>bold 1</strong><br><strong>bold 2</strong><br><em>italic 1</em><br><em>italic 1</em><br><em><strong>bold+italic</strong></em><br>regular"
    );
  });
});

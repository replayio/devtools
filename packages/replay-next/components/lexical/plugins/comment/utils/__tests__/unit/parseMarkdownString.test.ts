import parseMarkdownString from "../../parseMarkdownString";
import rangesToHtml from "../../rangesToHtml";

function assert(markdown: string, expectedHtml: string) {
  const ranges = parseMarkdownString(markdown);
  const actualHtml = rangesToHtml(ranges);
  expect(actualHtml).toBe(expectedHtml);
}

describe("parseMarkdownString", () => {
  test("handle plain text", async () => {
    assert("plain text", "plain text");
  });

  test("should parse simple styles", async () => {
    assert("This is **bold**", "This is <strong>bold</strong>");
    assert("This is __bold__", "This is <strong>bold</strong>");

    assert("This is *italic*", "This is <em>italic</em>");
    assert("This is _italic_", "This is <em>italic</em>");

    assert("This is `code`", "This is <code>code</code>");

    assert("This is ~~strikethrough~~", "This is <del>strikethrough</del>");

    assert(
      "This is **bold**, _italic_, `code`, and ~~strikethrough~~",
      "This is <strong>bold</strong>, <em>italic</em>, <code>code</code>, and <del>strikethrough</del>"
    );
  });

  test("should parse nested styles", async () => {
    assert(
      "This is **bold _and italic_**",
      "This is <strong>bold </strong><em><strong>and italic</strong></em>"
    );
  });

  test("should parse newlines", async () => {
    assert("line one\n\nline two", "line one<br><br>line two");
  });

  test("should parse mentions", async () => {
    assert("@mention at the beginning", "<label>@mention</label> at the beginning");
    assert("This is a @mention in the middle", "This is a <label>@mention</label> in the middle");
    assert("At the end is a @mention", "At the end is a <label>@mention</label>");

    assert("This is an email@gmail.com", "This is an email@gmail.com");

    assert("This is @@@weird", "This is @@@weird");

    assert(
      "@first-last and @name, with an email@gmail.com and a @@weird",
      "<label>@first-last</label> and <label>@name</label>, with an email@gmail.com and a @@weird"
    );
  });
});

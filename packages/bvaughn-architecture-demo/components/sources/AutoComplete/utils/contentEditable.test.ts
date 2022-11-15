import { getCursorIndexAfterPaste } from "./contentEditable";

describe("contentEditable", () => {
  describe("getCursorIndexAfterPaste", () => {
    function insertFromPaste(textWithCursor: string, textToPaste: string) {
      const index = textWithCursor.indexOf("|");
      const textContentAfterPaste = textWithCursor.replace("|", textToPaste);

      const cursorIndex = getCursorIndexAfterPaste(index, textToPaste);

      return (
        textContentAfterPaste.slice(0, cursorIndex) + "|" + textContentAfterPaste.slice(cursorIndex)
      );
    }

    function deleteContent(textWithSelectionRange: string) {
      const startIndex = textWithSelectionRange.indexOf("[");
      const endIndex = textWithSelectionRange.indexOf("]");
      const textContentAfterPaste =
        textWithSelectionRange.slice(0, startIndex) + textWithSelectionRange.slice(endIndex + 1);

      const cursorIndex = getCursorIndexAfterPaste(startIndex, "");

      return (
        textContentAfterPaste.slice(0, cursorIndex) + "|" + textContentAfterPaste.slice(cursorIndex)
      );
    }

    function insertReplacementText(textWithSelectionRange: string, replacementText: string) {
      const startIndex = textWithSelectionRange.indexOf("[");
      const endIndex = textWithSelectionRange.indexOf("]");
      const textContentAfterPaste =
        textWithSelectionRange.slice(0, startIndex) +
        replacementText +
        textWithSelectionRange.slice(endIndex + 1);

      const cursorIndex = getCursorIndexAfterPaste(startIndex, replacementText);

      return (
        textContentAfterPaste.slice(0, cursorIndex) + "|" + textContentAfterPaste.slice(cursorIndex)
      );
    }

    it("should return the correct cursor index after insertFromPaste", () => {
      expect(insertFromPaste("|", "abc")).toBe("abc|");
      expect(insertFromPaste("a|c", "b")).toBe("ab|c");
      expect(insertFromPaste("a | c", "bb")).toBe("a bb| c");
    });

    it("should return the correct cursor index after deleteContent", () => {
      expect(deleteContent("a[b]c")).toBe("a|c");
      expect(deleteContent("aaa [bbb] ccc")).toBe("aaa | ccc");
      expect(deleteContent("[abc]")).toBe("|");
    });

    it("should return the correct cursor index after insertReplacementText", () => {
      expect(insertReplacementText("[a]", "abc")).toBe("abc|");
      expect(insertReplacementText("[a]", "b")).toBe("b|");
      expect(insertReplacementText("[asd]", "asdasd")).toBe("asdasd|");
      expect(insertReplacementText("11 [22] 33", "444")).toBe("11 444| 33");
      expect(insertReplacementText("11 [22] 33", "2222")).toBe("11 2222| 33");
      expect(insertReplacementText("11 [22] 33", "422")).toBe("11 422| 33");

      // Edge case where pasting empty text (e.g. a deletion)
      expect(insertReplacementText("[abc]", "")).toBe("|");
      expect(insertReplacementText("[abc]de", "")).toBe("|de");
    });
  });
});

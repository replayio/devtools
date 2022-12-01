import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW, KEY_ENTER_COMMAND, KEY_TAB_COMMAND, TextNode } from "lexical";
import { useEffect, useRef } from "react";

import { IS_BOLD, IS_CODE, IS_ITALIC, IS_STRIKETHROUGH, IS_UNDERLINE } from "./constants";

const SUPPORTED_STYLES = IS_CODE | IS_STRIKETHROUGH | IS_BOLD | IS_ITALIC | IS_UNDERLINE;

export default function CommentPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    function onTextNodeTransform(node: TextNode) {
      if (!node.isAttached()) {
        return false;
      }

      const format = node.getFormat();

      // Prevent RichTextEditor from formatting rich text in ways we don't support in the parser.
      // For now, our parser is basic and only supports bold, italic, strikethrough, and code formats.
      if (format & ~SUPPORTED_STYLES) {
        node.setFormat(format & SUPPORTED_STYLES);
      }

      // We also don't want to allow nested formatting within code blocks.
      if (format & IS_CODE && format !== IS_CODE) {
        node.setFormat(IS_CODE);
      }
    }

    function onEnterCommand(event: KeyboardEvent) {
      if (!editor.isEditable()) {
        return false;
      }

      if (event?.shiftKey) {
        return false;
      } else {
        event.preventDefault();
        return true;
      }
    }

    const onTabCommand = (_: KeyboardEvent) => {
      // Tab characters should not indent code blocks.
      // Tabbing should change focus.
      return true;
    };

    return mergeRegister(
      editor.registerNodeTransform(TextNode, onTextNodeTransform),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnterCommand, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_TAB_COMMAND, onTabCommand, COMMAND_PRIORITY_LOW)
    );
  }, [editor]);

  return null;
}

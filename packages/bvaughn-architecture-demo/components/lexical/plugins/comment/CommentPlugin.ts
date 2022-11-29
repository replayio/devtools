import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { COMMAND_PRIORITY_CRITICAL, KEY_ENTER_COMMAND, TextNode } from "lexical";
import { useEffect, useRef } from "react";

import { IS_BOLD, IS_CODE, IS_ITALIC, IS_STRIKETHROUGH, IS_UNDERLINE } from "./constants";
import { $createLoomThumbnailNode } from "./LoomThumbnailNode";
import serialize from "./utils/serialize";

const SUPPORTED_STYLES = IS_CODE | IS_STRIKETHROUGH | IS_BOLD | IS_ITALIC | IS_UNDERLINE;

// TODO Are Loom ids always 32 chars long?
const LOOM_URL_REGEX = /[\B]{0,1}https:\/\/(www\.){0,1}loom\.com\/share\/([^\B]{32})[\B]{0,1}/;

export default function CommentPlugin({
  onChange,
  onSubmit,
}: {
  onChange: (value: string) => void;
  onSubmit: () => void;
}): null {
  const [editor] = useLexicalComposerContext();

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    // function onLoomThumbnailNodeTransform(node: LoomThumbnailNode) {
    //   // No-op
    // }

    function onTextNodeTransform(node: TextNode) {
      if (!node.isAttached()) {
        return false;
      }

      const format = node.getFormat();
      const textContent = node.getTextContent() ?? "";

      let match = textContent.match(LOOM_URL_REGEX);
      if (match) {
        const url = match[0];
        const loomId = match[2];

        const startIndex = match.index!;
        const endIndex = startIndex + url.length;

        const loomThumbnailNode = $createLoomThumbnailNode({ loomId });
        const nodes = node.splitText(startIndex, endIndex);
        const nodeToReplace = startIndex === 0 ? nodes[0] : nodes[1];
        nodeToReplace.replace(loomThumbnailNode);
      } else {
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
    }

    function onUpdate() {
      const editorState = editor.getEditorState();
      const serialized = serialize(editorState);
      onChangeRef.current(serialized);
    }

    function onEnterCommand(event: KeyboardEvent) {
      if (event?.shiftKey) {
        return false;
      } else {
        event.preventDefault();

        // Enter key is used to submit the terminal entry
        // const textContent = editor.getEditorState().read($rootTextContent);
        onSubmitRef.current();

        return true;
      }
    }

    return mergeRegister(
      editor.registerNodeTransform(TextNode, onTextNodeTransform),
      // editor.registerNodeTransform(
      //   LoomThumbnailNode,
      //   onLoomThumbnailNodeTransform,
      // ),
      editor.registerUpdateListener(onUpdate),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnterCommand, COMMAND_PRIORITY_CRITICAL)
    );
  }, [editor]);

  return null;
}

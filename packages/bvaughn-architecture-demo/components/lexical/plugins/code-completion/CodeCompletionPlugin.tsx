import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { $createTextNode, TextNode } from "lexical";
import * as React from "react";
import { useEffect } from "react";

import TypeAheadPlugin from "../typeahead/TypeAheadPlugin";
import CodeCompletionItemListRenderer from "./CodeCompletionItemListRenderer";
import findMatchingCodeCompletions from "./findMatchingCodeCompletions";
import getCodeCompletionQueryData from "./getCodeCompletionQueryData";
import { Match } from "./types";

export default function CodeCompletionPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    function onCodeCompletionTextNodeTransform(node: TextNode) {
      // Prevent RichTextEditor from formatting mentions text in any way.
      if (node.getFormat() !== 0) {
        node.setFormat(0);
      }
    }

    return mergeRegister(editor.registerNodeTransform(TextNode, onCodeCompletionTextNodeTransform));
  }, [editor]);

  return (
    <TypeAheadPlugin<Match>
      createItemNode={createItemNode}
      getQueryData={getCodeCompletionQueryData}
      findMatches={findMatchingCodeCompletions}
      ItemListRenderer={CodeCompletionItemListRenderer}
    />
  );
}

function createItemNode(match: Match) {
  return $createTextNode(match.text);
}

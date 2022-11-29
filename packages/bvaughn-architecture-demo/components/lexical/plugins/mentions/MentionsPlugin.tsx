import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import * as React from "react";
import { useEffect } from "react";

import TypeAheadPlugin from "../typeahead/TypeAheadPlugin";
import findMatchingMentions from "./findMatchingMentions";
import getMentionsQueryData from "./getMentionsQueryData";
import MentionsItemListRenderer from "./MentionsItemListRenderer";
import MentionsTextNode from "./MentionsTextNode";
import { TeamMember } from "./types";
import $createMentionsTextNode from "./utils/$createMentionsTextNode";

export default function MentionsPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    function onMentionsTextNodeTransform(node: MentionsTextNode) {
      // Prevent RichTextEditor from formatting mentions text in any way.
      if (node.getFormat() !== 0) {
        node.setFormat(0);
      }
    }

    return mergeRegister(
      editor.registerNodeTransform(MentionsTextNode, onMentionsTextNodeTransform)
    );
  }, [editor]);

  return (
    <TypeAheadPlugin<TeamMember>
      createItemNode={createItemNode}
      getQueryData={getMentionsQueryData}
      findMatches={findMatchingMentions}
      ItemListRenderer={MentionsItemListRenderer}
    />
  );
}

function createItemNode(teamMember: TeamMember) {
  return $createMentionsTextNode(`@${teamMember.username}`);
}

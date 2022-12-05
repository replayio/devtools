import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { useCallback, useEffect } from "react";

import TypeAheadPlugin from "../typeahead/TypeAheadPlugin";
import findMatches from "./findMatches";
import getQueryData from "./getQueryData";
import isExactMatch from "./isExactMatch";
import MentionsTextNode from "./MentionsTextNode";
import { Collaborator } from "./types";
import $createMentionsTextNode from "./utils/$createMentionsTextNode";
import styles from "./styles.module.css";

export default function MentionsPlugin({
  collaborators,
  dataTestId,
  dataTestName = "MentionsTypeAhead",
}: {
  collaborators: Collaborator[];
  dataTestId?: string;
  dataTestName?: string;
}): JSX.Element {
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

  const findMatchesWithCollaborators = useCallback(
    (query: string) => {
      return findMatches(collaborators, query, null);
    },
    [collaborators]
  );

  return (
    <TypeAheadPlugin<Collaborator>
      createItemNode={createItemNode}
      dataTestId={dataTestId}
      dataTestName={dataTestName}
      getQueryData={getQueryData}
      findMatches={findMatchesWithCollaborators}
      isExactMatch={isExactMatch}
      itemClassName={styles.Item}
      itemRenderer={itemRenderer}
      listClassName={styles.List}
    />
  );
}

function createItemNode(collaborator: Collaborator) {
  return $createMentionsTextNode(collaborator.id, collaborator.name);
}

function itemRenderer(collaborator: Collaborator) {
  return collaborator.name;
}

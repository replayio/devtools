import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { useCallback, useEffect } from "react";

import TypeAheadPlugin from "../typeahead/TypeAheadPlugin";
import findMatches from "./findMatches";
import getQueryData from "./getQueryData";
import isExactMatch from "./isExactMatch";
import MentionsTextNode from "./MentionsTextNode";
import $createMentionsTextNode from "./utils/$createMentionsTextNode";
import styles from "./styles.module.css";

export default function MentionsPlugin({
  collaboratorNames,
  dataTestId,
  dataTestName = "MentionsTypeAhead",
  onActivate,
  onDeactivate,
}: {
  collaboratorNames: string[];
  dataTestId?: string;
  dataTestName?: string;
  onActivate: () => void;
  onDeactivate: () => void;
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
      return findMatches(collaboratorNames, query, null);
    },
    [collaboratorNames]
  );

  return (
    <TypeAheadPlugin<string>
      createItemNode={createItemNode}
      dataTestId={dataTestId}
      dataTestName={dataTestName}
      getQueryData={getQueryData}
      findMatches={findMatchesWithCollaborators}
      isExactMatch={isExactMatch}
      itemClassName={styles.Item}
      listClassName={styles.List}
      onActivate={onActivate}
      onDeactivate={onDeactivate}
    />
  );
}

function createItemNode(collaboratorNames: string) {
  return $createMentionsTextNode(`@${collaboratorNames}`);
}

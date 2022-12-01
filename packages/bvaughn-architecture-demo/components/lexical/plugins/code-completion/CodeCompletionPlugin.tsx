import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { FrameId, PauseId } from "@replayio/protocol";
import { $createTextNode, TextNode } from "lexical";
import { useContext, useEffect } from "react";

import { SelectedFrameContext } from "bvaughn-architecture-demo/src/contexts/SelectedFrameContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import TypeAheadPlugin from "../typeahead/TypeAheadPlugin";
import findMatches from "./findMatches";
import getQueryData from "./getQueryData";
import isExactMatch from "./isExactMatch";
import { Match } from "./types";
import styles from "./styles.module.css";

export default function CodeCompletionPlugin({
  dataTestId,
  dataTestName = "CodeTypeAhead",
  onActivate,
  onDeactivate,
}: {
  dataTestId?: string;
  dataTestName?: string;
  onActivate: () => void;
  onDeactivate: () => void;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const replayClient = useContext(ReplayClientContext);
  const { selectedPauseAndFrameId } = useContext(SelectedFrameContext);
  let pauseId: PauseId | null = null;
  let frameId: FrameId | null = null;
  if (selectedPauseAndFrameId) {
    pauseId = selectedPauseAndFrameId.pauseId;
    frameId = selectedPauseAndFrameId.frameId;
  }

  const findMatchesWrapper = (query: string, queryScope: string | null) => {
    return findMatches(query, queryScope, replayClient, frameId, pauseId);
  };

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
      dataTestId={dataTestId}
      dataTestName={dataTestName}
      getQueryData={getQueryData}
      findMatches={findMatchesWrapper}
      isExactMatch={isExactMatch}
      itemClassName={styles.Item}
      listClassName={styles.List}
      onActivate={onActivate}
      onDeactivate={onDeactivate}
    />
  );
}

function createItemNode(match: Match) {
  return $createTextNode(match);
}

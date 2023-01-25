import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { FrameId, PauseId } from "@replayio/protocol";
import { $createTextNode, TextNode } from "lexical";
import { useContext, useEffect } from "react";

import { PauseAndFrameId } from "replay-next/src/contexts/SelectedFrameContext";
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
  pauseAndFrameId = null,
}: {
  dataTestId?: string;
  dataTestName?: string;
  pauseAndFrameId: PauseAndFrameId | null;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const replayClient = useContext(ReplayClientContext);

  let pauseId: PauseId | null = null;
  let frameId: FrameId | null = null;
  if (pauseAndFrameId != null) {
    pauseId = pauseAndFrameId.pauseId;
    frameId = pauseAndFrameId.frameId;
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
      arrowKeysShouldDismiss={true}
      createItemNode={createItemNode}
      dataTestId={dataTestId}
      dataTestName={dataTestName}
      getQueryData={getQueryData}
      findMatches={findMatchesWrapper}
      isExactMatch={isExactMatch}
      itemClassName={styles.Item}
      itemRenderer={itemRenderer}
      listClassName={styles.List}
    />
  );
}

function createItemNode(match: Match) {
  return $createTextNode(match);
}

function itemRenderer(code: string, query: string) {
  // Remove leading "."
  query = query.slice(1);

  let children = [];
  let inProgress = "";
  let codeIndex = 0;
  let queryIndex = 0;

  while (codeIndex < code.length) {
    const queryChar = query.charAt(queryIndex) || "";
    const codeChar = code.charAt(codeIndex);

    if (codeChar.toLowerCase() === queryChar.toLowerCase()) {
      if (inProgress !== "") {
        children.push(<span key={children.length}>{inProgress}</span>);
      }

      children.push(<strong key={children.length}>{codeChar}</strong>);

      inProgress = "";
      queryIndex++;
    } else {
      inProgress += codeChar;
    }

    codeIndex++;
  }

  if (inProgress !== "") {
    children.push(<span key={children.length}>{inProgress}</span>);
  }

  return children;
}

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { ExecutionPoint } from "@replayio/protocol";
import { $createTextNode, TextNode } from "lexical";
import { useContext, useEffect } from "react";

import { useCurrentFocusWindow } from "replay-next/src/hooks/useCurrentFocusWindow";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import TypeAheadPlugin from "../typeahead/TypeAheadPlugin";
import findMatches, { Context } from "./findMatches";
import getQueryData from "./getQueryData";
import isExactMatch from "./isExactMatch";
import { Match } from "./types";
import styles from "./styles.module.css";

export default function CodeCompletionPlugin({
  context,
  dataTestId,
  dataTestName = "CodeTypeAhead",
  executionPoint,
  time,
}: {
  context: Context;
  dataTestId?: string;
  dataTestName?: string;
  executionPoint: ExecutionPoint | null;
  time: number;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const replayClient = useContext(ReplayClientContext);

  const focusWindow = useCurrentFocusWindow();

  const findMatchesWrapper = (query: string, queryScope: string | null) => {
    return executionPoint
      ? findMatches(query, queryScope, replayClient, executionPoint, time, focusWindow, context)
      : [];
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

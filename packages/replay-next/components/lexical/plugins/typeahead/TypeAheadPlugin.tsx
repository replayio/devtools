import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  $getSelection,
  COMMAND_PRIORITY_NORMAL,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  LexicalNode,
  TextNode,
} from "lexical";
import { ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { INSERT_ITEM_COMMAND } from "./commands";
import TypeAheadPopup from "./TypeAheadPopup";
import { QueryData, TypeAheadSelection } from "./types";

export default function TypeAheadPlugin<Item extends Object>({
  anchorElem = document.body,
  arrowKeysShouldDismiss = false,
  createItemNode = $createTextNode as any,
  dataTestId,
  dataTestName,
  getQueryData,
  findMatches,
  isExactMatch,
  itemClassName = "",
  itemRenderer = (item: Item, query: string) => item as any,
  listClassName = "",
}: {
  anchorElem?: HTMLElement;
  arrowKeysShouldDismiss?: boolean;
  createItemNode?: (item: Item) => LexicalNode;
  dataTestId?: string;
  dataTestName?: string;
  getQueryData: (selection: TypeAheadSelection | null) => QueryData | null;
  findMatches: (query: string, queryAdditionalData: string | null) => Item[];
  isExactMatch: (query: string, item: Item) => boolean;
  itemClassName?: string;
  itemRenderer?: (item: Item, query: string) => ReactNode;
  listClassName?: string;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  const [queryData, setQueryData] = useState<QueryData | null>(null);

  // Ignore the first update.
  // We shouldn't show a type-ahead completion for an editor editor that just mounted and happens to contain content.
  const ignoreNextUpdateRef = useRef(true);

  // Shares most recently committed component state with imperative Lexical API (which only runs on mount)
  const committedStateRef = useRef({ queryData });
  useEffect(() => {
    committedStateRef.current.queryData = queryData;
  });

  useEffect(() => {
    const onUpdate = () => {
      if (!editor.isEditable()) {
        return;
      }

      if (ignoreNextUpdateRef.current) {
        // Don't re-show the popup if the user just selected an item.
        ignoreNextUpdateRef.current = false;
        return;
      }

      editor.update(async () => {
        const selection = $getSelection();
        const newQueryData = getQueryData(selection);

        setQueryData(newQueryData);
      });
    };

    const onInsertItem = ({ item }: { item: Item }) => {
      editor.update(() => {
        const { queryData } = committedStateRef.current;
        if (queryData === null) {
          return;
        }

        const itemNode = createItemNode(item);

        const { beginTextNode, beginOffset, endTextNode, endOffset } = queryData.textRange;

        let currentTextNode: LexicalNode | null = beginTextNode;
        nodes: while (currentTextNode !== null) {
          if (currentTextNode === beginTextNode) {
            if (currentTextNode === endTextNode) {
              if (beginOffset === endOffset) {
                const [firstTextNode] = currentTextNode.splitText(beginOffset);
                firstTextNode.insertAfter(itemNode);
                itemNode.select();
              } else {
                const [firstTextNode, secondTextNode] = currentTextNode.splitText(
                  beginOffset,
                  endOffset
                );

                if (beginOffset === 0 || secondTextNode == null) {
                  firstTextNode.replace(itemNode);
                } else {
                  secondTextNode.replace(itemNode);
                }

                itemNode.select();
              }

              break nodes;
            } else {
              const nextTextNode: TextNode | null = currentTextNode.getNextSibling();

              const [firstTextNode, secondTextNode] = currentTextNode.splitText(beginOffset);

              if (beginOffset === 0 || secondTextNode == null) {
                firstTextNode.replace(itemNode);
              } else {
                secondTextNode.replace(itemNode);
              }

              itemNode.select();

              currentTextNode = nextTextNode;
            }
          } else if (currentTextNode === endTextNode) {
            const [firstTextNode] = currentTextNode.splitText(endOffset);
            firstTextNode.remove();
            break nodes;
          } else {
            const nextTextNode: TextNode | null = currentTextNode.getNextSibling();
            currentTextNode.remove();
            currentTextNode = nextTextNode;
          }
        }

        // Don't re-show the popup if the user just selected an item.
        ignoreNextUpdateRef.current = true;

        setQueryData(null);
      });

      return true;
    };

    function onEditable() {
      if (!editor.isEditable()) {
        setQueryData(null);
      }
    }

    // Up/down arrow keys should not show a type-ahead suggestion,
    // and should dismiss a type-ahead suggestion if one is active.
    function onUpDownArrowKeyCommand() {
      if (arrowKeysShouldDismiss) {
        ignoreNextUpdateRef.current = true;
      }

      return arrowKeysShouldDismiss;
    }

    // Left/right arrow keys should dismiss a type-ahead suggestion.
    function onLeftRightArrowKeyCommand() {
      if (arrowKeysShouldDismiss) {
        ignoreNextUpdateRef.current = true;

        setQueryData(null);
      }

      return arrowKeysShouldDismiss;
    }

    return mergeRegister(
      editor.registerEditableListener(onEditable),
      editor.registerUpdateListener(onUpdate),
      editor.registerCommand(INSERT_ITEM_COMMAND, onInsertItem, COMMAND_PRIORITY_NORMAL),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        onUpDownArrowKeyCommand,
        COMMAND_PRIORITY_NORMAL
      ),
      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        onLeftRightArrowKeyCommand,
        COMMAND_PRIORITY_NORMAL
      ),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        onLeftRightArrowKeyCommand,
        COMMAND_PRIORITY_NORMAL
      ),
      editor.registerCommand(KEY_ARROW_UP_COMMAND, onUpDownArrowKeyCommand, COMMAND_PRIORITY_NORMAL)
    );
  }, [arrowKeysShouldDismiss, createItemNode, editor, findMatches, getQueryData]);

  return queryData === null
    ? null
    : createPortal(
        <Suspense>
          <TypeAheadPopup<Item>
            anchorElem={anchorElem}
            dataTestId={dataTestId}
            dataTestName={dataTestName}
            editor={editor}
            findMatches={findMatches}
            isExactMatch={isExactMatch}
            itemClassName={itemClassName}
            itemRenderer={itemRenderer}
            listClassName={listClassName}
            queryData={queryData}
            updateQueryData={setQueryData}
          />
        </Suspense>,
        anchorElem
      );
}

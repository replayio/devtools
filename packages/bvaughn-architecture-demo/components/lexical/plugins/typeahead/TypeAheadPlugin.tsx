import { AnyAaaaRecord } from "dns";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  $getSelection,
  COMMAND_PRIORITY_CRITICAL,
  LexicalNode,
  TextNode,
} from "lexical";
import { ReactNode, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { INSERT_ITEM_COMMAND } from "./commands";
import TypeAheadPopup from "./TypeAheadPopup";
import { QueryData, TypeAheadSelection } from "./types";

export default function TypeAheadPlugin<Item extends Object>({
  anchorElem = document.body,
  createItemNode = $createTextNode as any,
  dataTestId,
  dataTestName,
  getQueryData,
  findMatches,
  isExactMatch,
  itemClassName = "",
  itemRenderer = (item: Item) => item as any,
  listClassName = "",
  onActivate,
  onDeactivate,
}: {
  anchorElem?: HTMLElement;
  createItemNode?: (item: Item) => LexicalNode;
  dataTestId?: string;
  dataTestName?: string;
  getQueryData: (selection: TypeAheadSelection | null) => QueryData | null;
  findMatches: (query: string, queryAdditionalData: string | null) => Item[];
  isExactMatch: (query: string, item: Item) => boolean;
  itemClassName?: string;
  itemRenderer?: (item: Item) => ReactNode;
  listClassName?: string;
  onActivate: () => void;
  onDeactivate: () => void;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  const [queryData, setQueryData] = useState<QueryData | null>(null);

  const ignoreNextUpdateRef = useRef(false);

  const setQueryDataWrapper = useCallback((newQueryData: QueryData | null) => {
    setQueryData(newQueryData);

    if (newQueryData === null) {
      committedStateRef.current.onDeactivate();
    } else {
      committedStateRef.current.onActivate();
    }
  }, []);

  // Shares most recently committed component state with imperative Lexical API (which only runs on mount)
  const committedStateRef = useRef({ onActivate, onDeactivate, queryData });
  useEffect(() => {
    committedStateRef.current.onActivate = onActivate;
    committedStateRef.current.onDeactivate = onDeactivate;
    committedStateRef.current.queryData = queryData;
  });

  useEffect(() => {
    const handleUpdate = () => {
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

        setQueryDataWrapper(newQueryData);
      });
    };

    const onInsertItem = ({ item }: { item: Item }) => {
      editor.update(() => {
        const { queryData } = committedStateRef.current;
        if (queryData === null) {
          return;
        }

        const itemNode = createItemNode(item);

        const { beginTextNode, beginOffset, endTextNode, endOffset } = queryData.insertionTextRange;

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

        setQueryDataWrapper(null);
      });

      return true;
    };

    return mergeRegister(
      editor.registerUpdateListener(handleUpdate),
      editor.registerCommand(INSERT_ITEM_COMMAND, onInsertItem, COMMAND_PRIORITY_CRITICAL)
    );
  }, [createItemNode, editor, findMatches, getQueryData, setQueryDataWrapper]);

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
            updateQueryData={setQueryDataWrapper}
          />
        </Suspense>,
        anchorElem
      );
}

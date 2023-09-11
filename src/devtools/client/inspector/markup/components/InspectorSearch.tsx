import { Object as ProtocolObject } from "@replayio/protocol";
import React, { useLayoutEffect, useRef, useState } from "react";

import { isMacOS } from "shared/utils/os";
import type { UIThunkAction } from "ui/actions";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { searchDOM } from "../actions/markup";
import { getSelectedDomNodeId, nodeSelected } from "../reducers/markup";

const doFullTextSearch = (
  queryBefore: string,
  queryRef: { current: string },
  reverse: boolean
): UIThunkAction<Promise<ProtocolObject[] | undefined>> => {
  return async (dispatch, getState, { ThreadFront, replayClient, protocolClient }) => {
    const state = getState();
    const pauseIdBefore = state.pause.id;

    const results = await dispatch(searchDOM(queryBefore));

    const stateAfter = getState();
    const pauseIdAfter = stateAfter.pause.id;

    if (results?.length && pauseIdAfter === pauseIdBefore && queryRef.current === queryBefore) {
      const currentSelectedNode = stateAfter.markup.selectedNode;

      const currentIndex = currentSelectedNode
        ? results.findIndex(node => node.objectId === currentSelectedNode)
        : -1;
      let index;
      if (currentIndex == -1) {
        index = 0;
      } else if (reverse) {
        index = currentIndex ? currentIndex - 1 : results.length - 1;
      } else {
        index = currentIndex != results.length - 1 ? currentIndex + 1 : 0;
      }

      const node = results[index];

      dispatch(nodeSelected(node.objectId, "inspectorsearch"));
    }

    return results;
  };
};

export function InspectorSearch() {
  const dispatch = useAppDispatch();
  const selectedDomNodeId = useAppSelector(getSelectedDomNodeId);

  // TODO Add a loading indicator of some kind?
  const [searchText, setSearchText] = useState("");
  const [activeSearchText, setActiveSearchText] = useState<string | null>(null);

  const [results, setResults] = useState<ProtocolObject[] | null>(null);

  const latestSearchTextRef = useRef(searchText);

  const startFullTextSearch = async (query: string, reverseSearchDirection: boolean) => {
    if (activeSearchText !== query) {
      setActiveSearchText(query);
      setResults(null);
    }

    const results = await dispatch(
      doFullTextSearch(query, latestSearchTextRef, reverseSearchDirection)
    );

    setResults(results || null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  useLayoutEffect(() => {
    latestSearchTextRef.current = searchText;
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      startFullTextSearch(searchText, e.shiftKey);
    }

    // CMD+G should continue an in-progress search
    // CTRL+G is for go-to-line though
    const modifierKey = isMacOS() ? e.metaKey : e.ctrlKey;
    if (e.key === "g" && modifierKey) {
      startFullTextSearch(searchText, e.shiftKey);
      e.preventDefault();
    }
  };

  let labelText = "";
  let labelHidden = !results;

  if (results) {
    if (results.length === 0) {
      labelText = "No matches";
    } else {
      const resultsIndex = results.findIndex(node => node.objectId === selectedDomNodeId);
      labelText = `${resultsIndex + 1} of ${results.length}`;
    }
  }

  return (
    <>
      <div id="inspector-search" className="devtools-searchbox text-themeTextFieldColor">
        <input
          id="inspector-searchbox"
          className="devtools-searchinput"
          type="input"
          placeholder="Search HTML"
          autoComplete="off"
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          value={searchText}
        />
      </div>
      <div id="inspector-searchlabel-container" hidden={labelHidden}>
        <div
          className="devtools-separator"
          style={{ height: "calc(var(--theme-toolbar-height) - 8px" }}
        ></div>
        <span id="inspector-searchlabel" className="whitespace-nowrap">
          {labelText}
        </span>
      </div>
    </>
  );
}

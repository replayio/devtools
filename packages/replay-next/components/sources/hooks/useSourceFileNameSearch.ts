import { SourceId } from "@replayio/protocol";
import sortedIndexBy from "lodash/sortedIndexBy";
import { useContext, useLayoutEffect, useMemo, useRef, useState } from "react";

import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { getSourceFileName } from "replay-next/src/utils/source";

import type { Actions as SearchActions, State as SearchState } from "./useSearch";
import useSearch from "./useSearch";

export type Item = Source;
export type Result = {
  characterIndices: number[];
  source: Source;
  weight: number;
};

function search(query: string, sources: Source[]): Result[] {
  const needle = query.toLocaleLowerCase();
  const results: Result[] = [];

  for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex++) {
    const source = sources[sourceIndex];
    let queryIndex = 0;
    let queryCharacter = needle.charAt(queryIndex);

    const characterIndices: number[] = [];
    let weight = 0;

    // TODO Search the entire path/url (not just the file name)
    const fileName = getSourceFileName(source, true);
    if (fileName !== null) {
      for (let index = 0; index < fileName.length; index++) {
        const character = fileName.charAt(index);
        if (character === queryCharacter) {
          if (characterIndices.length > 0) {
            const prevCharacterIndex = characterIndices[characterIndices.length - 1];
            if (prevCharacterIndex === index - 1) {
              // Give weight to consecutive characters.
              weight++;
            }
          }

          characterIndices.push(index);

          queryIndex++;

          if (queryIndex >= needle.length) {
            // We've found a match!
            const result: Result = {
              characterIndices,
              source,
              weight,
            };

            // Insert results in order of weight (highest to lowest).
            const index = sortedIndexBy(results, result, ({ weight }) => -weight);
            results.splice(index, 0, result);
            break;
          } else {
            queryCharacter = needle.charAt(queryIndex);
          }
        }
      }
    }
  }

  return results;
}

export type Actions = SearchActions & {
  setSources: (sources: Source[]) => void;
};

export type JumpToState = {
  columnNumber: number | undefined;
  jumpTo: boolean;
  lineNumber: number | undefined;
};

export type State = SearchState<Item, Result> & JumpToState;

export default function useSourceFileNameSearch(): [State, Actions] {
  const { focusedSource, openSource } = useContext(SourcesContext);
  const focusedSourceId = focusedSource?.sourceId ?? null;

  const focusedSourceIdRef = useRef<SourceId | null>(null);

  const [sources, setSources] = useState<Source[]>([]);

  const [state, dispatch] = useSearch<Source, Result>(sources, search);
  const [jumpToState, setJumpToState] = useState<JumpToState>({
    columnNumber: undefined,
    jumpTo: false,
    lineNumber: undefined,
  });

  useLayoutEffect(() => {
    focusedSourceIdRef.current = focusedSourceId;
  }, [focusedSourceId]);

  const externalActions = useMemo(
    () => ({
      ...dispatch,
      search: (query: string) => {
        dispatch.search(query);

        const jumpTo = query.startsWith(":");

        let columnNumber: number | undefined = undefined;
        let lineNumber: number | undefined = undefined;
        if (jumpTo) {
          const pieces = query.slice(1).split(":");
          switch (pieces.length) {
            case 1:
              lineNumber = parseInt(pieces[0], 10);
              if (Number.isNaN(lineNumber)) {
                lineNumber = undefined;
              }
              break;
            case 2:
              columnNumber = parseInt(pieces[1], 10);
              if (Number.isNaN(columnNumber)) {
                columnNumber = undefined;
              }

              lineNumber = parseInt(pieces[0], 10);
              if (Number.isNaN(lineNumber)) {
                columnNumber = undefined;
                lineNumber = undefined;
              }
              break;
          }
        }

        setJumpToState({
          columnNumber: columnNumber ?? 0,
          jumpTo,
          lineNumber,
        });

        if (lineNumber != null) {
          const sourceId = focusedSourceIdRef.current;
          if (sourceId != null) {
            const lineIndex = lineNumber - 1;
            openSource("view-source", sourceId, lineIndex, lineIndex, columnNumber);
          }
        }
      },
      setSources,
    }),
    [dispatch, openSource]
  );

  const externalState = useMemo(
    () => ({
      ...state,
      ...jumpToState,
    }),
    [jumpToState, state]
  );

  return [externalState, externalActions];
}

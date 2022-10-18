import { getSourceFileName } from "@bvaughn/src/utils/source";
import { newSource as ProtocolSource } from "@replayio/protocol";
import sortedIndexBy from "lodash/sortedIndexBy";
import { useMemo, useState } from "react";

import useSearch from "./useSearch";
import type { Actions as SearchActions, State as SearchState } from "./useSearch";

export type Result = {
  characterIndices: number[];
  source: ProtocolSource;
  weight: number;
};

function search(query: string, sources: ProtocolSource[]): Result[] {
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
  setSources: (sources: ProtocolSource[]) => void;
};

export type State = SearchState<Result>;

export default function useSourceFileNameSearch(): [State, Actions] {
  const [sources, setSources] = useState<ProtocolSource[]>([]);

  const [state, dispatch] = useSearch<ProtocolSource, Result>(sources, search);

  const externalActions = useMemo(
    () => ({
      ...dispatch,
      setSources,
    }),
    [dispatch]
  );

  return [state, externalActions];
}

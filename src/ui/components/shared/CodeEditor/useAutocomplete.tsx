import { useCallback, useState, useEffect, useRef, useContext } from "react";
import {
  fuzzyFilter,
  getAutocompleteMatches,
  getLastExpression,
  getPropertyExpression,
  insertAutocompleteMatch,
  normalizeString,
  ObjectFetcher,
} from "ui/utils/autocomplete";
import uniq from "lodash/uniq";
import { useAppSelector } from "ui/setup/hooks";
import { getPauseId } from "devtools/client/debugger/src/reducers/pause";
import { getSelectedFrame, PauseFrame } from "devtools/client/debugger/src/selectors";
import { getEvaluatedProperties } from "devtools/client/webconsole/utils/autocomplete-eager";
import { FrameScopes, getScopesAsync } from "ui/suspense/scopeCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getObjectWithPreviewHelper } from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";

// turns an async getMatches function into a hook
function useGetAsyncMatches(
  expression: string,
  getMatches: (expression: string) => Promise<string[] | null>
): string[] {
  const [matches, setMatches] = useState<string[]>([]);
  const expressionRef = useRef(expression);
  useEffect(() => {
    expressionRef.current = expression;

    async function updateMatches() {
      setMatches([]);
      const matches = await getMatches(expression);
      if (matches && expressionRef.current === expression) {
        setMatches(matches);
      }
    }

    updateMatches();
  }, [expression, getMatches]);

  return matches;
}

async function getScopeMatches(
  expression: string,
  frameScope: FrameScopes,
  fetchObject: ObjectFetcher
): Promise<string[] | null> {
  if (!expression || !frameScope?.scopes.length) {
    return [];
  }
  return await getAutocompleteMatches(expression, frameScope.scopes, fetchObject);
}

function useGetScopeMatches(expression: string) {
  const pauseId = useAppSelector(getPauseId);
  const replayClient = useContext(ReplayClientContext);

  const getScopeMatchesForFrameScope = useCallback(
    async (expression: string) => {
      if (!pauseId) {
        return [] as string[];
      }
      // TODO Hardcoding frame ID 0 probably isn't great
      const frameScope = await getScopesAsync(pauseId, "0");
      if (!frameScope) {
        return [] as string[];
      }
      const fetchObject = (objectId: string) => {
        return getObjectWithPreviewHelper(replayClient, pauseId, objectId);
      };
      return getScopeMatches(expression, frameScope, fetchObject);
    },
    [pauseId, replayClient]
  );

  return useGetAsyncMatches(expression, getScopeMatchesForFrameScope);
}

async function getEvalMatches(
  expression: string,
  frame: PauseFrame | null,
  fetchObject: ObjectFetcher
): Promise<string[] | null> {
  if (!frame) {
    return null;
  }
  const propertyExpression = getPropertyExpression(expression);
  if (!propertyExpression) {
    return null;
  }
  const evaluatedProperties = await getEvaluatedProperties(
    propertyExpression.left,
    frame.asyncIndex,
    frame.protocolId,
    fetchObject
  );
  if (!evaluatedProperties) {
    return null;
  }
  return fuzzyFilter(evaluatedProperties, normalizeString(propertyExpression.right));
}

// This tries to autocomplete the property of the current expression.
function useGetEvalMatches(expression: string) {
  const frame = useAppSelector(getSelectedFrame);
  const replayClient = useContext(ReplayClientContext);

  const pauseId = useAppSelector(getPauseId);

  const getEvalMatchesForSelectedFrame = useCallback(
    async (expression: string) => {
      if (!pauseId) {
        return null;
      }
      const fetchObject = async (objectId: string) => {
        return getObjectWithPreviewHelper(replayClient, pauseId, objectId);
      };
      return getEvalMatches(expression, frame, fetchObject);
    },
    [frame, pauseId, replayClient]
  );
  return useGetAsyncMatches(expression, getEvalMatchesForSelectedFrame);
}

function useGetMatches(expression: string, isArgument: boolean) {
  const actualExpression = isArgument ? getLastExpression(expression) : expression;
  const scopeMatches = useGetScopeMatches(actualExpression);
  const evalMatches = useGetEvalMatches(actualExpression);

  return uniq([...scopeMatches, ...evalMatches]).sort();
}

function getShouldShowAutocomplete(
  expression: string,
  hideAutocomplete: boolean,
  matches: string[]
) {
  const matchCount = matches.length;

  // Bail if the only suggested autocomplete option has already been applied to the input.
  if (matchCount === 1 && insertAutocompleteMatch(expression, matches[0]) === expression) {
    return false;
  }

  return !hideAutocomplete && !!matchCount;
}

export default function useAutocomplete(
  expression: string,
  onPreviewAvailable: (val: string | null) => void,
  isArgument: boolean = false
) {
  const [isHidden, setIsHidden] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const matches = useGetMatches(expression, !!isArgument);

  const moveAutocompleteCursor = (difference: number) => {
    const matchesCount = matches.length;
    const newIndex = (matchesCount + selectedIndex - difference) % matchesCount;
    setSelectedIndex(newIndex);
  };
  const applySelectedMatch = () => {
    const match = matches[selectedIndex];
    return applyMatch(match);
  };
  const applyMatch = (match: string) => {
    return insertAutocompleteMatch(expression, match, isArgument);
  };

  useEffect(() => {
    // This is not optimal.
    onPreviewAvailable(applySelectedMatch());
  });

  return {
    autocompleteIndex: selectedIndex,
    matches,
    shouldShowAutocomplete: getShouldShowAutocomplete(expression, isHidden, matches),
    applyMatch,
    applySelectedMatch,
    moveAutocompleteCursor,
    resetAutocompleteIndex: () => setSelectedIndex(0),
    setHideAutocomplete: setIsHidden,
  };
}

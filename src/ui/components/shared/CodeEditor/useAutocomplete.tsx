import { useCallback, useState, useEffect, useRef } from "react";
import {
  fuzzyFilter,
  getAutocompleteMatches,
  getLastArgumentExpression,
  getPropertyExpression,
  insertAutocompleteMatch,
  normalizeString,
} from "ui/utils/autocomplete";
import uniq from "lodash/uniq";
import { useSelector } from "react-redux";
import { getFrameScope } from "devtools/client/debugger/src/reducers/pause";
import { UIState } from "ui/state";
import { getSelectedFrame, SelectedFrame } from "devtools/client/debugger/src/selectors";
import { getEvaluatedProperties } from "devtools/client/webconsole/utils/autocomplete-eager";
import { AutocompleteOptions } from "./AutocompleteMatches";

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

async function getScopeMatches(expression: string, frameScope: any): Promise<string[] | null> {
  if (!expression || !frameScope?.scope) {
    return [];
  }
  return await getAutocompleteMatches(expression, frameScope.scope);
}

function useGetScopeMatches(expression: string) {
  const frameScope = useSelector((state: UIState) => getFrameScope(state, "0:0"));
  const getScopeMatchesForFrameScope = useCallback(
    (expression: string) => getScopeMatches(expression, frameScope),
    [frameScope]
  );
  return useGetAsyncMatches(expression, getScopeMatchesForFrameScope);
}

async function getEvalMatches(
  expression: string,
  frame: SelectedFrame | null
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
    frame.protocolId
  );
  if (!evaluatedProperties) {
    return null;
  }
  return fuzzyFilter(evaluatedProperties, normalizeString(propertyExpression.right));
}

// This tries to autocomplete the property of the current expression.
function useGetEvalMatches(expression: string) {
  const frame = useSelector(getSelectedFrame);
  const getEvalMatchesForSelectedFrame = useCallback(
    (expression: string) => getEvalMatches(expression, frame),
    [frame]
  );
  return useGetAsyncMatches(expression, getEvalMatchesForSelectedFrame);
}

function useGetMatches(expression: string) {
  const scopeMatches = useGetScopeMatches(expression);
  const evalMatches = useGetEvalMatches(expression);

  return uniq([...scopeMatches, ...evalMatches]);
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
  exp: string,
  onPreviewAvailable: (val: string | null) => void,
  options: AutocompleteOptions
) {
  const [isHidden, setIsHidden] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const expression = options.isArg ? getLastArgumentExpression(exp)[1] : exp;
  const matches = useGetMatches(expression);

  const moveAutocompleteCursor = (difference: number) => {
    const matchesCount = matches.length;
    const newIndex = (matchesCount + selectedIndex - difference) % matchesCount;
    setSelectedIndex(newIndex);
  };
  const applySelectedMatch = () => {
    const match = matches[selectedIndex];
    return options.isArg
      ? getLastArgumentExpression(exp)[0] + insertAutocompleteMatch(expression, match)
      : insertAutocompleteMatch(expression, match);
  };

  useEffect(() => {
    // This is not optimal.
    onPreviewAvailable(applySelectedMatch());
  });

  return {
    autocompleteIndex: selectedIndex,
    matches,
    shouldShowAutocomplete: getShouldShowAutocomplete(expression, isHidden, matches),
    applySelectedMatch,
    moveAutocompleteCursor,
    resetAutocompleteIndex: () => setSelectedIndex(0),
    setHideAutocomplete: setIsHidden,
  };
}

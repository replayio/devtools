import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import {
  fuzzyFilter,
  getAutocompleteMatches,
  getPropertyExpression,
  insertAutocompleteMatch,
  normalizeString,
} from "../../utils/autocomplete";
import uniq from "lodash/uniq";
import { useSelector } from "react-redux";
import { getFrameScope } from "devtools/client/debugger/src/reducers/pause";
import { UIState } from "ui/state";
import { getEvaluatedProperties } from "../../actions/autocomplete-eager";

function useGetScopeMatches(expression: string) {
  const frameScope = useSelector((state: UIState) => getFrameScope(state, "0:0"));

  if (!expression || !frameScope?.scope) {
    return [];
  }

  return getAutocompleteMatches(expression, frameScope.scope);
}

// This tries to autocomplete the property of the current expression.
function useGetEvalMatches(expression: string) {
  const [matches, setMatches] = useState<string[]>([]);
  const expressionRef = useRef(expression);
  const dispatch = useDispatch();

  useEffect(() => {
    expressionRef.current = expression;

    async function updateMatches() {
      setMatches([]);
      const propertyExpression = getPropertyExpression(expression);

      if (!propertyExpression) {
        return;
      }

      const evaluatedProperties = await dispatch(getEvaluatedProperties(propertyExpression.left));

      if (expressionRef.current === expression) {
        setMatches(fuzzyFilter(evaluatedProperties, normalizeString(propertyExpression.right)));
      }
    }

    updateMatches();
  }, [expression]);

  return matches;
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

export default function useAutocomplete(expression: string) {
  const [isHidden, setIsHidden] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const matches = useGetMatches(expression);

  const moveAutocompleteCursor = (difference: number) => {
    const matchesCount = matches.length;
    const newIndex = (matchesCount + selectedIndex - difference) % matchesCount;
    setSelectedIndex(newIndex);
  };
  const applySelectedMatch = () => {
    const match = matches[selectedIndex];
    return insertAutocompleteMatch(expression, match);
  };

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

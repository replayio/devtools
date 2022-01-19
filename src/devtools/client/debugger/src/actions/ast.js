import { ThreadFront } from "protocol/thread";
import { getSourceIDsToSearch } from "devtools/client/debugger/src/utils/source";
import { formatProjectFunctions } from "../utils/quick-open";
import { getSources } from "../reducers/sources";
import {
  getGlobalFunctions,
  isGlobalFunctionsLoading,
} from "devtools/client/debugger/src/reducers/ast";

export function loadGlobalFunctions() {
  return async ({ dispatch, getState }) => {
    // Only load global functions once.
    if (getGlobalFunctions(getState()) !== null || isGlobalFunctionsLoading(getState())) {
      return;
    }

    dispatch({
      type: "LOADING_GLOBAL_FUNCTIONS",
    });

    await ThreadFront.ensureAllSources();

    const sourceById = getSources(getState()).values;
    // Empty query to grab all of the functions, which we can easily filter later.
    const query = "";
    const sourceIds = getSourceIDsToSearch(sourceById);

    const globalFns = [];

    await ThreadFront.searchFunctions({ query, sourceIds }, matches => {
      globalFns.push(...formatProjectFunctions(matches, sourceById));
    });

    dispatch({
      type: "SET_GLOBAL_FUNCTIONS",
      globalFns,
    });
  };
}

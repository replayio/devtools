import { getContext } from "../../selectors";
import { getTabs, tabsRestored } from "devtools/client/debugger/src/reducers/tabs";

import {
  allSourcesReceived,
  SourceDetails,
  getAllSourceDetails,
  getSourceToDisplayForUrl,
  getSourceToDisplayById,
} from "ui/reducers/sources";

import { getPreviousPersistedLocation } from "ui/reducers/sources";
import { AppStartListening } from "ui/setup/listenerMiddleware";

// Delay adding these until the store is created
export const setupSourcesListeners = (startAppListening: AppStartListening) => {
  // When sources are received, we need to:
  // - Update any persisted tabs to give them the correct source IDs for their URLs
  // - Check for an existing selected location, and open that automatically
  // - Restore any breakpoints that the user had set last time
  startAppListening({
    actionCreator: allSourcesReceived,
    effect: async (action, listenerApi) => {
      const { dispatch, getState } = listenerApi;
      const state = getState();

      const tabs = getTabs(state);
      const persistedLocation = getPreviousPersistedLocation(state);

      const sources = getAllSourceDetails(state);
      const cx = getContext(state);

      // Tabs are persisted with just a URL, but no `sourceId` because
      // those may change across sessions. Figure out the sources per URL.
      const canonicalTabSources = tabs
        .map(tab => getSourceToDisplayForUrl(state, tab.url)!)
        .filter(Boolean);

      // Now that we know what sources _were_ open, update the tabs data
      // so that the sources are associated with each tab
      dispatch(tabsRestored(canonicalTabSources));

      let selectedSourceToDisplay: SourceDetails | null = null;

      // There may have been a location persisted from the last time the user
      // had this recording open. If so, we want to try to restore that open
      // file and line.
      if (persistedLocation) {
        if (persistedLocation.sourceUrl) {
          selectedSourceToDisplay = getSourceToDisplayForUrl(state, persistedLocation.sourceUrl)!;
        } else if (persistedLocation.sourceId) {
          selectedSourceToDisplay = getSourceToDisplayById(state, persistedLocation.sourceId)!;
        }

        if (selectedSourceToDisplay) {
          const { selectLocation } = await import("../sources");

          await dispatch(
            selectLocation(cx, {
              column: persistedLocation.column,
              line: typeof persistedLocation.line === "number" ? persistedLocation.line : 0,
              sourceId: selectedSourceToDisplay.id,
              sourceUrl: selectedSourceToDisplay.url,
            })
          );
        }
      }
    },
  });
};

import { getTabs, tabsRestored } from "devtools/client/debugger/src/reducers/tabs";
import { sourcesByIdCache, sourcesByUrlCache } from "replay-next/src/suspense/SourcesCache";
import { getSourceToDisplayById } from "replay-next/src/utils/sources";
import { getSourceToDisplayForUrl } from "replay-next/src/utils/sources";
import { SourceDetails, allSourcesReceived } from "ui/reducers/sources";
import { getPreviousPersistedLocation } from "ui/reducers/sources";
import { AppStartListening } from "ui/setup/listenerMiddleware";

import { getContext } from "../../selectors";

// Delay adding these until the store is created
export const setupSourcesListeners = (startAppListening: AppStartListening) => {
  // When sources are received, we need to:
  // - Update any persisted tabs to give them the correct source IDs for their URLs
  // - Check for an existing selected location, and open that automatically
  // - Restore any breakpoints that the user had set last time
  startAppListening({
    actionCreator: allSourcesReceived,
    effect: async (action, listenerApi) => {
      const {
        dispatch,
        getState,
        extra: { replayClient },
      } = listenerApi;
      const state = getState();

      const tabs = getTabs(state);
      const persistedLocation = getPreviousPersistedLocation(state);

      const cx = getContext(state);

      const sourcesById = await sourcesByIdCache.readAsync(replayClient);
      const sourcesByUrl = await sourcesByUrlCache.readAsync(replayClient);

      // Tabs are persisted with just a URL, but no `sourceId` because
      // those may change across sessions. Figure out the sources per URL.
      const canonicalTabSources = tabs
        .map(tab => getSourceToDisplayForUrl(sourcesById, sourcesByUrl, tab.url)!)
        .filter(Boolean);

      // Now that we know what sources _were_ open, update the tabs data
      // so that the sources are associated with each tab
      dispatch(tabsRestored(canonicalTabSources));

      let selectedSourceToDisplay: SourceDetails | undefined = undefined;

      // There may have been a location persisted from the last time the user
      // had this recording open. If so, we want to try to restore that open
      // file and line.
      if (persistedLocation) {
        if (persistedLocation.sourceUrl) {
          selectedSourceToDisplay = getSourceToDisplayForUrl(
            sourcesById,
            sourcesByUrl,
            persistedLocation.sourceUrl
          );
        } else if (persistedLocation.sourceId) {
          selectedSourceToDisplay = getSourceToDisplayById(sourcesById, persistedLocation.sourceId);
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

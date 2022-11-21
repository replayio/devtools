import { useContext, useLayoutEffect } from "react";

import SearchFiles from "bvaughn-architecture-demo/components/search-files/SearchFiles";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { onViewSourceInDebugger } from "devtools/client/webconsole/actions";
import { getSourceDetailsEntities } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Adapter that connects file search to Redux state.
export default function SearchFilesReduxAdapter() {
  const { currentSearchResultLocation } = useContext(SourcesContext);

  const sourcesById = useAppSelector(getSourceDetailsEntities);
  const dispatch = useAppDispatch();

  // When a user clicks on a search in the file-search panel, open it in Redux as well.
  useLayoutEffect(() => {
    if (currentSearchResultLocation != null) {
      const url = sourcesById[currentSearchResultLocation.sourceId]?.url;
      if (url) {
        dispatch(
          onViewSourceInDebugger({
            url,
            sourceId: currentSearchResultLocation.sourceId,
            line: currentSearchResultLocation.line,
            column: currentSearchResultLocation.column,
          })
        );
      }
    }
  }, [currentSearchResultLocation, dispatch, sourcesById]);

  return <SearchFiles />;
}

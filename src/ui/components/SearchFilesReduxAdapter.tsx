import { useContext, useLayoutEffect } from "react";

import SearchFiles from "bvaughn-architecture-demo/components/search-files/SearchFiles";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { onViewSourceInDebugger } from "devtools/client/webconsole/actions";
import { getSourceDetailsEntities } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Adapter that connects file search to Redux state.
export default function SearchFilesReduxAdapter() {
  const { focusedSource } = useContext(SourcesContext);

  const sourcesById = useAppSelector(getSourceDetailsEntities);
  const dispatch = useAppDispatch();

  // When a user clicks on a search in the file-search panel, open it in Redux as well.
  useLayoutEffect(() => {
    if (focusedSource != null) {
      const { mode, startLineIndex, sourceId } = focusedSource;
      if (mode === "search-result") {
        const url = sourcesById[sourceId]?.url;
        if (url) {
          dispatch(
            onViewSourceInDebugger({
              url,
              sourceId,
              line: startLineIndex !== null ? startLineIndex + 1 : undefined,
              column: 0,
            })
          );
        }
      }
    }
  }, [dispatch, focusedSource, sourcesById]);

  return <SearchFiles />;
}

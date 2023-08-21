import { useContext, useLayoutEffect } from "react";

import { onViewSourceInDebugger } from "devtools/client/webconsole/actions";
import SearchFiles from "replay-next/components/search-files/SearchFiles";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { getSourceDetailsEntities } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Adapter that connects file search to Redux state.
export default function SearchFilesReduxAdapter() {
  const { focusedSource } = useContext(SourcesContext);
  const { startLineIndex, sourceId } = focusedSource ?? {};

  const sourcesById = useAppSelector(getSourceDetailsEntities);
  const dispatch = useAppDispatch();

  // When a user clicks on a search in the file-search panel, open it in Redux as well.
  useLayoutEffect(() => {
    if (startLineIndex != null && sourceId != null) {
      dispatch(
        onViewSourceInDebugger({
          column: 0,
          line: startLineIndex !== null ? startLineIndex + 1 : undefined,
          openSource: true,
          sourceId,
        })
      );
    }
  }, [dispatch, startLineIndex, sourceId, sourcesById]);

  return <SearchFiles />;
}

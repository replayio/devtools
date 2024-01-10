import { useContext, useEffect, useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { STATUS_PENDING, STATUS_RESOLVED, useStreamingValue } from "suspense";

import Icon from "replay-next/components/Icon";
import { FileSearchListData, Item } from "replay-next/components/search-files/FileSearchListData";
import { GenericList } from "replay-next/components/windowing/GenericList";
import { SourceSearchResult, StreamingSearchValue } from "replay-next/src/suspense/SearchCache";
import { sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import type { ItemData } from "./ResultsListRow";
import ResultsListRow, { ITEM_SIZE } from "./ResultsListRow";
import styles from "./ResultsList.module.css";

const EMPTY_ARRAY = [] as SourceSearchResult[];

export default function ResultsList({
  query,
  streaming,
}: {
  query: string;
  streaming: StreamingSearchValue;
}) {
  const replayClient = useContext(ReplayClientContext);

  const { data, status, value: orderedResults = EMPTY_ARRAY } = useStreamingValue(streaming);

  const isPending = status === STATUS_PENDING;

  const sources = sourcesCache.read(replayClient);

  const didOverflow = data?.didOverflow ?? false;

  const listData = useMemo(() => new FileSearchListData(orderedResults), [orderedResults]);

  // Data streams in to the same array, so we need to let the list know when to recompute the item count.
  useEffect(() => {
    listData.resultsUpdated();
  }, [listData, orderedResults, orderedResults.length]);

  const itemData = useMemo<ItemData>(
    () => ({
      listData,
      query,
      sources,
    }),
    [listData, query, sources]
  );

  if (status === STATUS_RESOLVED && orderedResults.length === 0) {
    return null;
  }

  return (
    <div
      className={isPending ? styles.ResultsPending : styles.Results}
      data-test-id="SourceSearch-Results"
    >
      {didOverflow && (
        <div className={styles.OverflowHeader} data-test-id="SourceSearch-OverflowMessage">
          <Icon className={styles.OverflowIcon} type="warning" />
          The result set only contains a subset of all matches. Be more specific in your search to
          narrow down the results.
        </div>
      )}
      <div className={styles.List}>
        <AutoSizer
          children={({ height, width }) => (
            <GenericList<Item, ItemData>
              className={styles.List}
              height={height}
              itemData={itemData}
              itemRendererComponent={ResultsListRow}
              itemSize={ITEM_SIZE}
              listData={listData}
              width={width}
            />
          )}
        />
      </div>
    </div>
  );
}

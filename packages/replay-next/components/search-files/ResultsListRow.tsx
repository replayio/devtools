import { CSSProperties, useContext, useMemo } from "react";
import { useImperativeIntervalCacheValues } from "suspense";

import Expandable from "replay-next/components/Expandable";
import Icon from "replay-next/components/Icon";
import { FileSearchListData, Item } from "replay-next/components/search-files/FileSearchListData";
import HighlightMatch from "replay-next/components/search-files/HighlightMatch";
import { GenericListItemData } from "replay-next/components/windowing/GenericList";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import {
  SourceSearchResultLocation,
  SourceSearchResultMatch,
  isSourceSearchResultLocation,
  isSourceSearchResultMatch,
} from "replay-next/src/suspense/SearchCache";
import { sourceHitCountsCache } from "replay-next/src/suspense/SourceHitCountsCache";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { getSourceFileName } from "replay-next/src/utils/source";
import { getRelativePathWithoutFile } from "replay-next/src/utils/url";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { toPointRange } from "shared/utils/time";

import styles from "./ResultsListRow.module.css";

export const ITEM_SIZE = 20;

export type ItemData = {
  listData: FileSearchListData;
  query: string;
  sources: Source[];
};

export default function ResultsListItem({
  data,
  index,
  style,
}: {
  data: GenericListItemData<Item, ItemData>;
  index: number;
  style: CSSProperties;
}) {
  const { itemData, listData: genericListData } = data;

  const listData = genericListData as FileSearchListData;
  const { isCollapsed, result } = listData.getItemAtIndex(index);

  if (isSourceSearchResultLocation(result)) {
    return (
      <LocationRow
        index={index}
        isCollapsed={isCollapsed}
        listData={listData}
        result={result}
        sources={itemData.sources}
        style={style}
      />
    );
  } else if (isSourceSearchResultMatch(result)) {
    return <MatchRow query={itemData.query} result={result} style={style} />;
  } else {
    throw Error("Unexpected result type");
  }
}

function LocationRow({
  index,
  isCollapsed,
  listData,
  result,
  sources,
  style,
}: {
  index: number;
  isCollapsed: boolean;
  listData: FileSearchListData;
  result: SourceSearchResultLocation;
  sources: Source[];
  style: CSSProperties;
}) {
  const { id, location, matchCount } = result;

  const [fileName, path] = useMemo(() => {
    const source = sources.find(({ sourceId }) => sourceId === location.sourceId);
    if (source == null) {
      return ["(unknown)", ""];
    }

    const fileName = getSourceFileName(source);
    const path = source.url ? getRelativePathWithoutFile(source.url) : "";

    return [fileName, path];
  }, [location, sources]);

  const locationString = `${fileName} ${path ? `(${path})` : ""}`;

  return (
    <div
      data-test-id={`SearchFiles-ResultRow-${location.sourceId}`}
      data-test-name="SearchFiles-ResultRow"
      data-test-filename={fileName}
      data-test-type="Location"
      style={style}
    >
      <Expandable
        children={null}
        defaultOpen={!isCollapsed}
        header={
          <>
            <Icon className={styles.LocationIcon} type="file" />
            <div className={styles.Location} data-private title={locationString}>
              {locationString}
            </div>
            <div className={styles.Count}>
              ({matchCount === 1 ? "1 match" : `${matchCount} matches`})
            </div>
          </>
        }
        headerClassName={styles.LocationRow}
        key={id /* Re-apply defaultCollapsed if row content changes */}
        onChange={collapsed => listData.toggleCollapsed(index, !collapsed)}
      />
    </div>
  );
}

function MatchRow({
  query,
  result,
  style,
}: {
  query: string;
  result: SourceSearchResultMatch;
  style: CSSProperties;
}) {
  const { range } = useContext(FocusContext);
  const replayClient = useContext(ReplayClientContext);
  const { openSource } = useContext(SourcesContext);

  const { context, location } = result.match;

  const { status, value: hitCounts } = useImperativeIntervalCacheValues(
    sourceHitCountsCache,
    result.match.location.line,
    result.match.location.line,
    replayClient,
    result.match.location.sourceId,
    range ? toPointRange(range) : null
  );
  const hitCount = status === "resolved" ? hitCounts[0]?.[1].count ?? 0 : undefined;

  return (
    <div
      className={styles.MatchRow}
      data-hit-count={hitCount}
      data-private
      data-test-name="SearchFiles-ResultRow"
      data-test-type="Match"
      onClick={() => {
        const lineIndex = location.line - 1;
        openSource("search-result", location.sourceId, lineIndex, lineIndex);
      }}
      style={style}
    >
      <span className={styles.GroupLine}>&nbsp;&nbsp;</span>
      <HighlightMatch caseSensitive={false} needle={query} text={context.trim()} />
    </div>
  );
}

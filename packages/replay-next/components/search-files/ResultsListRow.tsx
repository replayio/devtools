import { CSSProperties, memo, useContext, useMemo } from "react";
import { areEqual } from "react-window";

import Expandable from "replay-next/components/Expandable";
import Icon from "replay-next/components/Icon";
import HighlightMatch from "replay-next/components/search-files/HighlightMatch";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import {
  SourceSearchResult,
  SourceSearchResultLocation,
  SourceSearchResultMatch,
  isSourceSearchResultLocation,
  isSourceSearchResultMatch,
} from "replay-next/src/suspense/SearchCache";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { getSourceFileName } from "replay-next/src/utils/source";
import { getRelativePathWithoutFile } from "replay-next/src/utils/url";

import styles from "./ResultsListRow.module.css";

export type ItemData = {
  getResultAtIndex(index: number): SourceSearchResult | null;
  isLocationCollapsed(index: number): boolean;
  query: string;
  sources: Source[];
  toggleLocation(rowIndex: number, isOpen: boolean): void;
};

const MemoizedResultsListRow = memo(
  ({ data, index, style }: { data: ItemData; index: number; style: CSSProperties }) => {
    const { getResultAtIndex, isLocationCollapsed, query, sources, toggleLocation } = data;

    const result = getResultAtIndex(index);
    if (result == null) {
      console.error(`No result for row ${index}`);
      return null;
    }

    if (isSourceSearchResultLocation(result)) {
      const isCollapsed = isLocationCollapsed(index);
      return (
        <LocationRow
          isCollapsed={isCollapsed}
          result={result}
          rowIndex={index}
          sources={sources}
          style={style}
          toggleLocation={toggleLocation}
        />
      );
    } else if (isSourceSearchResultMatch(result)) {
      return <MatchRow result={result} query={query} style={style} />;
    } else {
      console.error("Unexpected result type:", result);
      return null;
    }
  },
  areEqual
);
MemoizedResultsListRow.displayName = "ResultsListRow";

function LocationRow({
  isCollapsed,
  result,
  rowIndex,
  sources,
  style,
  toggleLocation,
}: {
  isCollapsed: boolean;
  result: SourceSearchResultLocation;
  rowIndex: number;
  sources: Source[];
  style: CSSProperties;
  toggleLocation: (rowIndex: number, isOpen: boolean) => void;
}) {
  const { location, matchCount } = result;

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
            <div className={styles.Location} title={locationString}>
              {locationString}
            </div>
            <div className={styles.Count}>
              ({matchCount === 1 ? "1 match" : `${matchCount} matches`})
            </div>
          </>
        }
        headerClassName={styles.LocationRow}
        onChange={isOpen => toggleLocation(rowIndex, isOpen)}
      />
    </div>
  );
}

function MatchRow({
  result,
  query,
  style,
}: {
  result: SourceSearchResultMatch;
  query: string;
  style: CSSProperties;
}) {
  const { match } = result;

  const { openSource } = useContext(SourcesContext);

  return (
    <div
      className={styles.MatchRow}
      data-test-name="SearchFiles-ResultRow"
      data-test-type="Match"
      onClick={() => {
        const lineIndex = match.location.line - 1;
        openSource("search-result", match.location.sourceId, lineIndex, lineIndex);
      }}
      style={style}
    >
      <span className={styles.GroupLine}>&nbsp;&nbsp;</span>
      <HighlightMatch caseSensitive={false} needle={query} text={match.context.trim()} />
    </div>
  );
}

export default MemoizedResultsListRow;

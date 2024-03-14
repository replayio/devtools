import { ClassOutline, FunctionOutline, Location } from "@replayio/protocol";
import classnames from "classnames";
import { Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import { useImperativeCacheValue } from "suspense";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import Spinner from "replay-next/components/Spinner";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import {
  SourceOutlineWithHitCounts,
  outlineHitCountsCache,
} from "replay-next/src/suspense/OutlineHitCountsCache";
import { useSourcesById } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { toPointRange } from "shared/utils/time";
import { SourceDetails, getSelectedSourceId } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { selectLocation } from "../../actions/sources";
import { getContext, getCursorPosition } from "../../selectors";
import { findClosestEnclosedSymbol } from "../../utils/ast";
import OutlineFilter from "../PrimaryPanes/OutlineFilter";
import { getOutlineSymbols } from "./getOutlineSymbols";
import { isFunctionOutline } from "./isFunctionOutline";
import { SourceOutlineClass } from "./SourceOutlineClass";
import { SourceOutlineFunction } from "./SourceOutlineFunction";
import styles from "./SourceOutline.module.css";

export function SourceOutline({
  cursorPosition,
  selectedSource,
  symbols,
}: {
  cursorPosition: Location | null;
  selectedSource: SourceDetails | null;
  symbols: SourceOutlineWithHitCounts | null;
}) {
  const dispatch = useAppDispatch();
  const cx = useAppSelector(getContext);

  const [filter, setFilter] = useState("");
  const outlineSymbols = useMemo(
    () => (symbols ? getOutlineSymbols(symbols, filter) : null),
    [symbols, filter]
  );
  const [focusedSymbol, setFocusedSymbol] = useState<ClassOutline | FunctionOutline | null>(null);
  const listRef = useRef<any>();

  const closestSymbolIndex = useMemo(() => {
    if (!cursorPosition) {
      return;
    }
    const symbol = findClosestEnclosedSymbol(symbols, cursorPosition);
    return outlineSymbols?.findIndex(a => a === symbol);
  }, [cursorPosition, outlineSymbols, symbols]);

  // TODO [jasonLaster] Fix react-hooks/exhaustive-deps
  useEffect(() => {
    if (outlineSymbols && closestSymbolIndex) {
      const symbol = outlineSymbols[closestSymbolIndex];
      setFocusedSymbol(symbol);
      if (listRef.current) {
        listRef.current.scrollToItem(closestSymbolIndex, "center");
      }
    }
  }, [closestSymbolIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectSymbol = useCallback(
    (symbol: ClassOutline | FunctionOutline) => {
      dispatch(
        selectLocation(cx, {
          sourceId: selectedSource!.id,
          sourceUrl: selectedSource!.url!,
          line: symbol.location.begin.line,
          column: symbol.location.begin.column,
        })
      );
      setFocusedSymbol(symbol);
    },
    [dispatch, selectedSource, cx]
  );

  const MemoizedOutlineItem = useCallback(
    ({ index, style }: { index: number; style: Object }) => {
      const symbol = outlineSymbols![index];
      const isFocused = focusedSymbol === symbol;
      if (!symbol) {
        return null;
      }
      return (
        <div style={style}>
          {isFunctionOutline(symbol) ? (
            <SourceOutlineFunction
              isFocused={isFocused}
              func={symbol}
              onSelect={handleSelectSymbol}
            />
          ) : (
            <SourceOutlineClass
              isFocused={isFocused}
              klass={symbol}
              onSelect={handleSelectSymbol}
            />
          )}
        </div>
      );
    },
    [handleSelectSymbol, outlineSymbols, focusedSymbol]
  );

  if (!selectedSource) {
    return (
      <div className="text-themeBodyColor mx-2 mt-2 mb-4 space-y-3 whitespace-normal rounded-lg bg-chrome p-3 text-center text-xs">
        {`Select a source to see available functions`}
      </div>
    );
  }

  if (!symbols) {
    return (
      <div className="flex justify-center p-4">
        <Spinner className="h-4 w-4 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!outlineSymbols || outlineSymbols.length == 0) {
    return (
      <div className={classnames("flex h-full flex-col")}>
        <OutlineFilter filter={filter} updateFilter={setFilter} />
        <div className="onboarding-text space-y-3 whitespace-normal p-3 text-base text-gray-500">
          <p>{`No functions were found.`}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classnames("flex h-full flex-col space-y-2")}>
      <OutlineFilter filter={filter} updateFilter={setFilter} />
      {symbols.hasHitCounts || (
        <div className={styles.Warning}>Outline hit counts could not be loaded for this source</div>
      )}
      <div className="outline-list flex-grow">
        <AutoSizer
          children={({ height, width }) => {
            const list = (
              <List
                innerElementType="ol"
                height={height}
                width={width}
                itemCount={outlineSymbols.length}
                itemSize={24}
                ref={listRef}
              >
                {MemoizedOutlineItem}
              </List>
            );

            return list;
          }}
        />
      </div>
    </div>
  );
}

export default function SourceOutlineWrapper() {
  // This goofy outer selection is so that SourceOutline.stories can inject fake values.
  const replayClient = useContext(ReplayClientContext);
  const cursorPosition = useAppSelector(getCursorPosition);
  const selectedSourceId = useAppSelector(getSelectedSourceId);
  const sourcesById = useSourcesById(replayClient);
  const selectedSource = selectedSourceId ? sourcesById.get(selectedSourceId) : undefined;
  const { range: focusRange } = useContext(FocusContext);

  let symbols: SourceOutlineWithHitCounts | null = null;
  const symbolsCacheValue = useImperativeCacheValue(
    outlineHitCountsCache,
    replayClient,
    selectedSource?.id,
    focusRange ? toPointRange(focusRange) : null
  );
  if (symbolsCacheValue.status === "resolved") {
    symbols = symbolsCacheValue.value;
  }

  return (
    <InlineErrorBoundary name="SourceOutlineWrapper" key={selectedSource?.id}>
      <Suspense fallback={null}>
        <SourceOutline
          cursorPosition={cursorPosition || null}
          selectedSource={selectedSource || null}
          symbols={symbols}
        />
      </Suspense>
    </InlineErrorBoundary>
  );
}

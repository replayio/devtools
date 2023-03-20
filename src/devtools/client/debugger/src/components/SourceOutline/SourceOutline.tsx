import { Location } from "@replayio/protocol";
import classnames from "classnames";
import React, {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { sourceHitCountsCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import Spinner from "ui/components/shared/Spinner";
import { SourceDetails, getSelectedSource } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { LoadingStatus } from "ui/utils/LoadingStatus";

import { selectLocation } from "../../actions/sources";
import { ClassDeclaration, FunctionDeclaration, getSymbols } from "../../reducers/ast";
import { SymbolEntry, getContext, getCursorPosition } from "../../selectors";
import { findClosestEnclosedSymbol } from "../../utils/ast";
import OutlineFilter from "../PrimaryPanes/OutlineFilter";
import { getOutlineSymbols } from "./getOutlineSymbols";
import { isFunctionDeclaration } from "./isFunctionSymbol";
import { SourceOutlineClass } from "./SourceOutlineClass";
import { SourceOutlineFunction } from "./SourceOutlineFunction";

export function SourceOutline({
  cursorPosition,
  selectedSource,
  symbols,
}: {
  cursorPosition: Location | null;
  selectedSource: SourceDetails | null;
  symbols: SymbolEntry | null;
}) {
  const dispatch = useAppDispatch();
  const cx = useAppSelector(getContext);

  const replayClient = useContext(ReplayClientContext);
  const { range: focusRange } = useContext(FocusContext);
  const { visibleLines } = useContext(SourcesContext);

  const hitCounts =
    selectedSource && visibleLines
      ? sourceHitCountsCache.read(replayClient, selectedSource.id, visibleLines, focusRange)
      : null;

  const [filter, setFilter] = useState("");
  const outlineSymbols = useMemo(
    () => getOutlineSymbols(symbols, filter, hitCounts),
    [symbols, filter, hitCounts]
  );
  const [focusedSymbol, setFocusedSymbol] = useState<ClassDeclaration | FunctionDeclaration | null>(
    null
  );
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
    (symbol: ClassDeclaration | FunctionDeclaration) => {
      dispatch(
        selectLocation(cx, {
          sourceId: selectedSource!.id,
          sourceUrl: selectedSource!.url!,
          line: symbol.location.start.line,
          column: symbol.location.start.column,
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
          {isFunctionDeclaration(symbol) ? (
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

  if (!selectedSource || !symbols) {
    return (
      <div className="text-themeBodyColor mx-2 mt-2 mb-4 space-y-3 whitespace-normal rounded-lg bg-chrome p-3 text-center text-xs">
        {`Select a source to see available functions`}
      </div>
    );
  }

  if (!symbols || symbols.status === LoadingStatus.LOADING) {
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
      <div className="outline-list flex-grow">
        <AutoSizer>
          {({ height, width }) => {
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
        </AutoSizer>
      </div>
    </div>
  );
}

export default function SourceOutlineWrapper() {
  // This goofy outer selection is so that SourceOutline.stories can inject fake values.
  const cursorPosition = useAppSelector(getCursorPosition);
  const selectedSource = useAppSelector(getSelectedSource);
  const symbols = useAppSelector(state =>
    selectedSource ? getSymbols(state, selectedSource) : null
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <SourceOutline
          cursorPosition={cursorPosition || null}
          selectedSource={selectedSource || null}
          symbols={symbols}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

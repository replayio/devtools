import React, { useRef, useCallback, useMemo, useState, useEffect } from "react";
import classnames from "classnames";

import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import OutlineFilter from "../PrimaryPanes/OutlineFilter";
import { findClosestEnclosedSymbol } from "../../utils/ast";
import { SourceOutlineClass } from "./SourceOutlineClass";
import { SourceOutlineFunction } from "./SourceOutlineFunction";
import { getOutlineSymbols } from "./getOutlineSymbols";
import { FunctionSymbol, ClassSymbol } from "../../types";
import { connect, ConnectedProps, useDispatch } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import Spinner from "ui/components/shared/Spinner";
import { getHitCountsForSelectedSource } from "../../reducers/sources";
import { setBreakpointHitCounts } from "devtools/client/debugger/src/actions/sources";

export function isFunctionSymbol(symbol: FunctionSymbol | ClassSymbol): symbol is FunctionSymbol {
  return "parameterNames" in symbol;
}

export function SourceOutline({
  cx,
  cursorPosition,
  selectedSource,
  symbols,
  hitCounts,
  selectLocation,
}: PropsFromRedux) {
  const [filter, setFilter] = useState("");
  const outlineSymbols = useMemo(
    () => getOutlineSymbols(symbols, filter, hitCounts),
    [symbols, filter, hitCounts]
  );
  const [focusedSymbol, setFocusedSymbol] = useState<ClassSymbol | FunctionSymbol | null>(null);
  const listRef = useRef<any>();

  const closestSymbolIndex = useMemo(() => {
    if (!cursorPosition) {
      return;
    }
    const symbol = findClosestEnclosedSymbol(symbols, cursorPosition);
    return outlineSymbols?.findIndex(a => a === symbol);
  }, [cursorPosition, outlineSymbols, symbols]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectedSource) {
      // We start by loading the first N lines of hits, where N is the line limit.
      dispatch(setBreakpointHitCounts(selectedSource.id, 1));
    }
  }, [dispatch, selectedSource]);

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
    (symbol: ClassSymbol | FunctionSymbol) => {
      selectLocation(cx, {
        sourceId: selectedSource!.id,
        sourceUrl: selectedSource!.url!,
        line: symbol.location.start.line,
        column: symbol.location.start.column,
      });
      setFocusedSymbol(symbol);
    },
    [selectLocation, selectedSource, cx]
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
          {isFunctionSymbol(symbol) ? (
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
      <div className="text-themeBodyColor mx-2 mt-2 mb-4 space-y-3 whitespace-normal rounded-lg bg-themeTextFieldBgcolor p-3 text-center text-xs">
        {`Select a source to see available functions`}
      </div>
    );
  }

  if (!symbols || symbols.loading) {
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

const mapStateToProps = (state: UIState) => {
  const selectedSource = selectors.getSelectedSourceWithContent(state);
  const symbols = selectedSource ? selectors.getSymbols(state, selectedSource) : null;
  const hitCounts = selectedSource ? getHitCountsForSelectedSource(state) : null;
  return {
    cursorPosition: selectors.getCursorPosition(state),
    cx: selectors.getContext(state),
    hitCounts,
    selectedSource: selectedSource,
    symbols,
  };
};

const connector = connect(mapStateToProps, {
  selectLocation: actions.selectLocation,
});

type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SourceOutline);

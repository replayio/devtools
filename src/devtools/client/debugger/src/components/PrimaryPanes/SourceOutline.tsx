import React, { useMemo, useCallback, useState, HTMLProps, useRef, useEffect } from "react";
import classnames from "classnames";

import { fuzzySearch } from "../../utils/function";
import uniq from "lodash/uniq";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Source, SourceLocation } from "graphql";
import OutlineFilter from "./OutlineFilter";
import { Redacted } from "ui/components/Redacted";
import PreviewFunction from "../shared/PreviewFunction";
import { groupBy, keyBy, reduce, sortBy } from "lodash";
import { findClosestEnclosedSymbol } from "../../utils/ast";
import { Location } from "@recordreplay/protocol";

type ClassSymbol = {
  name: string;
  location: {
    start: SourceLocation;
    end: SourceLocation;
  };
};

type FunctionSymbol = {
  name: string | null;
  klass: string | null;
  location: {
    start: SourceLocation;
    end: SourceLocation;
  };
  parameterNames: string[];
};

type OutlineSymbol = ClassSymbol | FunctionSymbol;

function isFunctionSymbol(symbol: OutlineSymbol): symbol is FunctionSymbol {
  return "parameterNames" in symbol;
}

function getOutlineSymbols(
  { classes, functions }: { classes: ClassSymbol[]; functions: FunctionSymbol[] },
  filter: string
) {
  const classNames = new Set(classes.map(s => s.name));
  const functionsByName = keyBy(functions, "name");
  const filteredFunctions = functions.filter(
    ({ name }) =>
      !!name && name !== "anonymous" && !classNames.has(name) && fuzzySearch(name, filter)
  );
  const functionsByClass = groupBy(filteredFunctions, func => func.klass || "");

  return classes.reduce((funcs: Array<ClassSymbol | FunctionSymbol>, classSymbol) => {
    const classFuncs = functionsByClass[classSymbol.name];
    if (classFuncs?.length > 0) {
      funcs.push(functionsByName[classSymbol.name] || classSymbol, ...classFuncs);
    }
    return funcs;
  }, functionsByClass[""] || []);
}

const SourceOutlineFunction = React.memo(function OutlineFunction({
  isFocused,
  func,
  onSelect,
}: {
  isFocused: boolean;
  func: FunctionSymbol;
  onSelect?: (func: FunctionSymbol) => void;
}) {
  return (
    <li
      className={classnames("outline-list__element cursor-pointer", {
        "px-2": !!func.klass,
        focused: isFocused,
      })}
      onClick={onSelect ? () => onSelect(func) : undefined}
    >
      <span className="outline-list__element-icon">λ</span>
      <Redacted className="inline-block">
        <PreviewFunction func={func} />
      </Redacted>
    </li>
  );
});

const SourceOutlineClass = React.memo(function OutlineClassFunctions({
  klass,
  isFocused,
  onSelect,
}: {
  klass: OutlineSymbol;
  isFocused: boolean;
  onSelect: (klass: ClassSymbol | FunctionSymbol) => void;
}) {
  return (
    <li className="outline-list__class" key={klass.name}>
      <h2
        className={classnames("cursor-pointer", { focused: isFocused })}
        onClick={() => onSelect(klass)}
      >
        {"paramNames" in klass ? (
          <SourceOutlineFunction func={klass} isFocused={false} />
        ) : (
          <div>
            <span className="keyword">class</span> {klass.name}
          </div>
        )}
      </h2>
    </li>
  );
});

type PropTypes = HTMLProps<HTMLDivElement> & {
  cursorPosition: Location;
  onChangeCursorPosition: (selectedLocation: Location) => void;
  sourceId: string;
  symbols: {
    functions: FunctionSymbol[];
    classes: ClassSymbol[];
    loading: false;
  };
};

export function SourceOutline({
  className,
  cursorPosition,
  onChangeCursorPosition,
  sourceId,
  symbols,
  ...props
}: PropTypes) {
  const [filter, setFilter] = useState("");

  const items = useMemo(() => getOutlineSymbols(symbols, filter), [filter, symbols]);

  const focusedSymbol = useMemo(
    () => (cursorPosition ? findClosestEnclosedSymbol(symbols, cursorPosition) : null),
    [cursorPosition, symbols]
  );

  const handleSelectSymbol = useCallback(
    (symbol: ClassSymbol | FunctionSymbol) =>
      onChangeCursorPosition({
        sourceId,
        line: symbol.location.start.line,
        column: symbol.location.start.column,
      }),
    []
  );

  const OutlineItem = useCallback(
    ({ index, style }) => {
      const symbol = items[index];
      const isFocused = focusedSymbol === symbol;
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
    [handleSelectSymbol, items]
  );

  return (
    <div {...props} className={classnames("h-full flex flex-col", className)}>
      <OutlineFilter filter={filter} updateFilter={setFilter} />
      <div className="flex-grow my-1 mx-3">
        <AutoSizer>
          {({ height, width }) => (
            <List
              innerElementType="ol"
              height={height}
              width={width}
              itemCount={items.length}
              itemSize={24}
            >
              {OutlineItem}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

import React, { useMemo, useCallback, useState, HTMLProps } from "react";
import classnames from "classnames";

import { fuzzySearch } from "../../utils/function";
import uniq from "lodash/uniq";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Location } from "@recordreplay/protocol";
import { Class } from "@babel/types";
import { SourceLocation } from "graphql";
import { Source } from "protocol/thread/thread";

function formatData(symbols: any, filter: string) {
  if (!symbols || !symbols.functions) {
    return { classes: [], namedFunctions: [], functions: [] };
  }

  const functions = symbols.functions.filter(func => func.name != "anonymous");

  let classes = uniq(functions.map(func => func.klass));

  let namedFunctions = functions.filter(
    func => fuzzySearch(func.name, filter) && !func.klass && !classes.includes(func.name)
  );

  return { classes, namedFunctions };
}

type SymbolLocation = {
  start: SourceLocation;
  end: SourceLocation;
};

type ClassSymbol = {
  name: string;
  parent: null | ClassSymbol;
};

type FunctionSymbol = {
  name: string | null;
  identifier: string | null;
  index: number;
  klass: string | null;
  location: SymbolLocation;
  parameterNames: string[];
};

type PropTypes = HTMLProps<HTMLDivElement> & {
  selectLocation: {
    id: string;
    url: string;
    relativeUrl: string;
    isPrettyPrinted: boolean;
    content: {
      state: string;
      value: {
        type: "text";
        value: string;
      };
    };
  };
  symbols: {
    functions: FunctionSymbol[];
    classes: ClassSymbol[];
    hasJsx: boolean;
    hasTypes: boolean;
    loading: boolean;
  };
};

export function SourceOutline({
  className,
  selectLocation,
  selectedSource,
  symbols,
  ...props
}: PropTypes) {
  const [filter, setFilter] = useState("");

  const namedFunctions = useMemo(() => {
    const { namedFunctions } = formatData(symbols, filter);
    return namedFunctions;
  }, [filter, symbols]);

  const Function = useCallback(
    ({ index, style }) => {
      const func = namedFunctions[index];
      const { name, location, parameterNames } = func;
      console.info(func);

      return (
        <li
          className={classnames("outline-list__element cursor-pointer px-2 py-1", {
            focused: false,
          })}
          style={style}
        >
          <span className="outline-list__element-icon">λ</span>
          {name}
          {/* <Redacted className="inline-block">
            <PreviewFunction func={{ name, parameterNames }} />
          </Redacted> */}
        </li>
      );
    },
    [namedFunctions]
  );
  console.info(namedFunctions);

  return (
    <div {...props} className={classnames("h-full", className)}>
      {/* <OutlineFilter filter={filter} updateFilter={setFilter} /> */}
      <AutoSizer>
        {({ height, width }) => (
          <List
            innerElementType="ol"
            height={height}
            width={width}
            itemCount={namedFunctions.length}
            itemSize={22}
          >
            {Function}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

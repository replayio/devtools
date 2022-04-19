import classnames from "classnames";
import { ClassSymbol, FunctionSymbol } from "devtools/client/debugger/src/types";
import React from "react";

import { isFunctionSymbol } from "./SourceOutline";
import { SourceOutlineFunction } from "./SourceOutlineFunction";

export const SourceOutlineClass = React.memo(function OutlineClassFunctions({
  klass,
  isFocused,
  onSelect,
}: {
  klass: ClassSymbol;
  isFocused: boolean;
  onSelect: (klass: ClassSymbol | FunctionSymbol) => void;
}) {
  return (
    <li className="outline-list__class  mb-2" key={klass.name}>
      <h2
        className={classnames("cursor-pointer", { focused: isFocused })}
        onClick={() => onSelect(klass)}
      >
        {isFunctionSymbol(klass) ? (
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

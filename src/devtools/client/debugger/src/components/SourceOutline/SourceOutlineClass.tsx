import classnames from "classnames";
import React from "react";

import { ClassDeclaration, FunctionDeclaration } from "../../reducers/ast";
import { isFunctionDeclaration } from "./isFunctionSymbol";
import { SourceOutlineFunction } from "./SourceOutlineFunction";

export const SourceOutlineClass = React.memo(function OutlineClassFunctions({
  klass,
  isFocused,
  onSelect,
}: {
  klass: ClassDeclaration;
  isFocused: boolean;
  onSelect: (klass: ClassDeclaration | FunctionDeclaration) => void;
}) {
  return (
    <li className="outline-list__class  mb-2" key={klass.name}>
      <h2
        className={classnames("cursor-pointer", { focused: isFocused })}
        onClick={() => onSelect(klass)}
      >
        {isFunctionDeclaration(klass) ? (
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

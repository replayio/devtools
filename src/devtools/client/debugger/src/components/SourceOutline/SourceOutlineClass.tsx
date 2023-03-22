import { ClassOutline, FunctionOutline } from "@replayio/protocol";
import classnames from "classnames";
import React from "react";

import { isFunctionOutline } from "./isFunctionOutline";
import { SourceOutlineFunction } from "./SourceOutlineFunction";

export const SourceOutlineClass = React.memo(function OutlineClassFunctions({
  klass,
  isFocused,
  onSelect,
}: {
  klass: ClassOutline;
  isFocused: boolean;
  onSelect: (klass: ClassOutline | FunctionOutline) => void;
}) {
  return (
    <li className="outline-list__class  mb-2" key={klass.name}>
      <h2
        className={classnames("cursor-pointer", { focused: isFocused })}
        onClick={() => onSelect(klass)}
      >
        {isFunctionOutline(klass) ? (
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

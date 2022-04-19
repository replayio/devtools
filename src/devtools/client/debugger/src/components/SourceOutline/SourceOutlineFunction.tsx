import classnames from "classnames";
import React from "react";
import { Redacted } from "ui/components/Redacted";

import { FunctionSymbol } from "../../types";
import PreviewFunction from "../shared/PreviewFunction";

export const SourceOutlineFunction = React.memo(function OutlineFunction({
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
        focused: isFocused,
        indent: !!func.klass,
      })}
      onClick={onSelect ? () => onSelect(func) : undefined}
    >
      <div>
        <span className="outline-list__element-icon">λ</span>
        <Redacted className="inline-block">
          <PreviewFunction func={func} />
        </Redacted>
      </div>
      {func.hits !== undefined && (
        <div className="rounded bg-themeMenuHighlight px-2 text-bodyColor">{func.hits}</div>
      )}
    </li>
  );
});

import React from "react";
import classnames from "classnames";
import { Redacted } from "ui/components/Redacted";
import PreviewFunction from "../shared/PreviewFunction";
import { FunctionSymbol } from "../../types";

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
        indent: !!func.klass,
        focused: isFocused,
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
        <div className="flex-shrink-0 rounded-md bg-themeMenuHighlight py-0.5 px-2 font-mono text-bodyColor ">
          {func.hits}
        </div>
      )}
    </li>
  );
});

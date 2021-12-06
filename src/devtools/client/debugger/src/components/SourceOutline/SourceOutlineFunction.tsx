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
        "pl-4": !!func.klass,
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

import classnames from "classnames";
import React from "react";

import { Redacted } from "ui/components/Redacted";

import PreviewFunction from "../shared/PreviewFunction";
import { FunctionDeclarationHits } from "./getOutlineSymbols";

export const SourceOutlineFunction = React.memo(function OutlineFunction({
  isFocused,
  func,
  onSelect,
}: {
  isFocused: boolean;
  func: FunctionDeclarationHits;
  onSelect?: (func: FunctionDeclarationHits) => void;
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
        <div className="rounded bg-themeMenuHighlight px-2 text-bodyColor">{func.hits}</div>
      )}
    </li>
  );
});

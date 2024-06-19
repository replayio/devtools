import classnames from "classnames";
import React from "react";

import { FunctionOutlineWithHitCount } from "replay-next/src/suspense/OutlineHitCountsCache";

import PreviewFunction from "../shared/PreviewFunction";

export const SourceOutlineFunction = React.memo(function OutlineFunction({
  isFocused,
  func,
  onSelect,
}: {
  isFocused: boolean;
  func: FunctionOutlineWithHitCount;
  onSelect?: (func: FunctionOutlineWithHitCount) => void;
}) {
  return (
    <li
      className={classnames("outline-list__element cursor-pointer", {
        indent: !!func.className,
        focused: isFocused,
      })}
      onClick={onSelect ? () => onSelect(func) : undefined}
    >
      <div>
        <span className="outline-list__element-icon">λ</span>
        <div className="inline-block">
          <PreviewFunction func={func} />
        </div>
      </div>
      {func.hits !== undefined && (
        <div className="rounded bg-themeMenuHighlight px-2 text-bodyColor">{func.hits}</div>
      )}
    </li>
  );
});

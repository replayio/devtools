import React, { useEffect, useRef } from "react";
const classnames = require("classnames");
import { Redacted } from "ui/components/Redacted";
import PreviewFunction from "../shared/PreviewFunction";
import { isVisible } from "ui/utils/dom";

export const OutlineFunction = React.memo(function OutlineFunction({
  isFocused,
  func,
  onSelect,
  outlineList,
}) {
  const itemRef = useRef();

  useEffect(() => {
    if (isFocused && itemRef.current && !isVisible(outlineList, itemRef.current)) {
      itemRef.current.scrollIntoView({ block: "center" });
    }
  }, [isFocused]);
  return (
    <li
      className={classnames("outline-list__element", { focused: isFocused })}
      ref={itemRef}
      onClick={onSelect ? () => onSelect(func) : undefined}
    >
      <span className="outline-list__element-icon">λ</span>
      <Redacted className="inline-block">
        <PreviewFunction func={func} />
      </Redacted>
    </li>
  );
});

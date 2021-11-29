import React, { useEffect, useRef } from "react";
const classnames = require("classnames");
import { OutlineFunction } from "./OutlineFunction";

export const OutlineClassFunctions = React.memo(function OutlineClassFunctions({
  classFunc,
  classInfo,
  isFocused,
  onSelect,
  outlineList,
  children,
}) {
  const itemRef = useRef();

  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ block: "center" });
    }
  }, [isFocused]);

  const item = classFunc || classInfo;
  const className = item.klass && item.name == "anonymous" ? item.klass : item.name;

  return (
    <li className="outline-list__class" key={className}>
      <h2
        className={classnames("", { focused: isFocused })}
        onClick={() => onSelect(item)}
        ref={itemRef}
      >
        {classFunc ? (
          <OutlineFunction func={classFunc} isFocused={false} outlineList={outlineList} />
        ) : (
          <div>
            <span className="keyword">class</span> {className}
          </div>
        )}
      </h2>
      <ul className="outline-list__class-list">{children}</ul>
    </li>
  );
});

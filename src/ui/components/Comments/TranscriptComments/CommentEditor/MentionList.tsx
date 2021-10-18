import classNames from "classnames";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { KeyboardEvent } from "react";

export const MentionList = forwardRef((props: { items: any[]; command: any }, ref: any) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command({ id: item });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return false;
      }

      return false;
    },
  }));

  return (
    <div className="context-menu">
      {props.items.map((item, index) => (
        <button
          className={classNames("context-menu-item", {
            "bg-primaryAccent": index === selectedIndex,
            "text-white": index === selectedIndex,
          })}
          key={index}
          onClick={() => selectItem(index)}
        >
          {item}
        </button>
      ))}
    </div>
  );
});

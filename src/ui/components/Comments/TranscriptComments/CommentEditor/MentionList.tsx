import { Editor } from "@tiptap/react";
import classNames from "classnames";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";

export const MentionList = forwardRef((props: { items: any[]; command: any }, ref: any) => {
  if (!(props as any).editor.isEditable) {
    return null;
  }

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
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="flex flex-col bg-faintGrey py-1 rounded shadow-md text-xs">
      {props.items.map((item, index) => (
        <button
          className={classNames("px-2 py-1 text-left", {
            "text-primaryAccent": index === selectedIndex,
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

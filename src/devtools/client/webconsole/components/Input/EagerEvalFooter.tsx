import React, { FC, useEffect, useRef, useState } from "react";
import { ValueFront } from "protocol/thread";

const ObjectInspector =
  require("devtools/client/webconsole/utils/connected-object-inspector").default;

const Preview: FC<{ grip: ValueFront }> = ({ grip }) => {
  const [text, setText] = useState("");
  const gripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (gripRef.current) {
      setText(gripRef.current.innerText);
    }
  }, [grip]);

  return (
    <div className="pointer-events-none relative">
      <div className="absolute opacity-0" ref={gripRef}>
        <ObjectInspector value={grip} />
      </div>
      <div className="overflow-ellipsis overflow-hidden whitespace-pre opacity-50">{text}</div>
    </div>
  );
};

const EagerEvalFooter: FC<{ value?: string; grip: ValueFront | null }> = ({ value, grip }) => {
  return (
    <div
      className="message result flex items-center font-mono"
      style={{
        padding: "4px 8px 4px 4px",
        borderTop: "1px solid var(--theme-splitter-color)",
        borderBottom: "0px",
        minHeight: "var(--editor-footer-height)",
      }}
    >
      {value && grip ? (
        <>
          <div
            className="icon"
            style={{
              width: `1.5rem`,
              marginInlineStart: `var(--console-icon-horizontal-offset)`,
              marginInlineEnd: `calc(4px - var(--console-icon-horizontal-offset))`,
            }}
          />
          <Preview grip={grip} />
        </>
      ) : null}
    </div>
  );
};

export default EagerEvalFooter;

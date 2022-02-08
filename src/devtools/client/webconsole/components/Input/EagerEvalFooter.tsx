import React, { FC } from "react";
import { ValueFront } from "protocol/thread";

const ObjectInspector =
  require("devtools/client/webconsole/utils/connected-object-inspector").default;

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
          <div className="opacity-50">
            <ObjectInspector value={grip} />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default EagerEvalFooter;

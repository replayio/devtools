import ObjectInspector from "devtools/client/webconsole/utils/connected-object-inspector";
import { ValueFront } from "protocol/thread";
import React, { FC, useEffect, useRef, useState } from "react";

import { useEagerEvaluateExpression } from "../../utils/autocomplete-eager";

function useEagerEvalPreview(expression: string) {
  const [value, setValue] = useState<ValueFront | null>(null);
  const expressionRef = useRef(expression);
  const eagerEvaluateExpression = useEagerEvaluateExpression();

  useEffect(() => {
    expressionRef.current = expression;

    (async function updateValue() {
      setValue(null);
      const rv = await eagerEvaluateExpression(expression);
      const isUndefined = rv?.isPrimitive && !rv.primitive;

      if (expressionRef.current === expression && !isUndefined) {
        setValue(rv);
      }
    })();
  }, [expression, eagerEvaluateExpression]);

  return value;
}

const Preview: FC<{ expression: string }> = ({ expression }) => {
  const [text, setText] = useState("");
  const gripRef = useRef<HTMLDivElement | null>(null);
  const previewValue = useEagerEvalPreview(expression);

  useEffect(() => {
    if (gripRef.current) {
      setText(gripRef.current.innerText);
    }
  }, [previewValue]);

  if (!previewValue) {
    return null;
  }

  return (
    <div className="pointer-events-none relative">
      <div className="absolute opacity-0" ref={gripRef}>
        <ObjectInspector value={previewValue} />
      </div>
      <div className="overflow-hidden overflow-ellipsis whitespace-pre opacity-50">{text}</div>
    </div>
  );
};

const EagerEvalFooter: FC<{ expression: string; completedExpression: string | null }> = ({
  expression,
  completedExpression,
}) => {
  return (
    <div
      className="message result flex items-center font-mono"
      style={{
        borderBottom: "0px",
        borderTop: "1px solid var(--theme-background",
        minHeight: "var(--editor-footer-height)",
        padding: "4px 8px 4px 4px",
      }}
    >
      {expression ? (
        <>
          <div
            className="icon"
            style={{
              marginInlineEnd: `calc(4px - var(--console-icon-horizontal-offset))`,
              marginInlineStart: `var(--console-icon-horizontal-offset)`,
              width: `1.5rem`,
            }}
          />
          <Preview expression={completedExpression || expression} />
        </>
      ) : null}
    </div>
  );
};

export default EagerEvalFooter;

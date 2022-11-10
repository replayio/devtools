import { KeyboardEvent, Suspense, useLayoutEffect, useRef, useState } from "react";

import { parse } from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";

import getExpressionFromString from "../utils/getExpressionFromString";
import updateStringWithExpression from "../utils/updateStringWithExpression";
import AutoCompleteList from "./AutoCompleteList";
import {
  getCursorClientX,
  getCursorIndex,
  selectAllText,
  setCursor,
} from "./utils/contentEditable";
import styles from "./AutoComplete.module.css";

export default function AutoComplete({
  autoFocus,
  className = "",
  dataTestId,
  dataTestName,
  onCancel: onCancelProp,
  onChange: onChangeProp,
  onSubmit: onSubmitProp,
  value,
}: {
  autoFocus: boolean;
  className: string;
  dataTestId?: string;
  dataTestName?: string;
  onCancel: () => void;
  onChange: (newValue: string) => void;
  onSubmit: () => void;
  value: string;
}) {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [expression, setExpression] = useState<string | null>(null);
  const [cursorClientX, setCursorClientX] = useState<number | null>(null);
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (autoFocus) {
      const contentEditable = contentEditableRef.current;
      if (contentEditable) {
        selectAllText(contentEditable);
      }
    }
  }, [autoFocus]);

  useLayoutEffect(() => {
    if (cursorIndex !== null) {
      const contentEditable = contentEditableRef.current;
      if (contentEditable) {
        setCursor(contentEditable, cursorIndex);
        setCursorIndex(null);
      }
    }
  }, [cursorIndex]);

  const onInput = () => {
    const contentEditable = contentEditableRef.current;
    if (contentEditable) {
      const cursorIndex = getCursorIndex(contentEditable);
      const newValue = contentEditable.textContent || "";
      if (newValue !== value) {
        onChangeProp(newValue);
        setCursorIndex(cursorIndex);
        updateExpression();
      }
    }
  };

  const updateExpression = () => {
    const contentEditable = contentEditableRef.current;
    if (contentEditable) {
      const value = contentEditable.textContent || "";
      const cursorIndex = getCursorIndex(contentEditable);
      const expression = getExpressionFromString(value, cursorIndex);

      // Account for scrolling
      setCursorClientX(getCursorClientX(contentEditable) - contentEditable.scrollLeft);
      setExpression(expression);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter": {
        event.preventDefault();
        if (!expression) {
          onSubmitProp();
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        if (expression) {
          setExpression(null);
        } else {
          onCancelProp();
        }
        break;
      }
      case "ArrowLeft":
      case "ArrowRight": {
        // Once the cursor has updated, re-evaluate the expression.
        // Wait until the end of the current frame (so the cursor location has updated).
        // We could do this in a key-up handler instead, but it feels less responsive;
        // there is a small amount of visual delay.
        setTimeout(updateExpression);
        break;
      }
    }
  };

  const onSubmit = (match: string) => {
    const contentEditable = contentEditableRef.current;
    if (contentEditable) {
      const value = contentEditable.textContent || "";
      const cursorIndex = getCursorIndex(contentEditable);
      const [newValue, newCursorIndex] = updateStringWithExpression(value, cursorIndex, match);

      onChangeProp(newValue);
      setCursorIndex(newCursorIndex);

      contentEditable.focus();
    }

    setExpression(null);
  };

  const lines = parse(value, ".js");
  const html = lines && lines.length > 0 ? lines[0] : "";

  return (
    <>
      <div
        className={`${className} ${styles.Input}`}
        contentEditable
        dangerouslySetInnerHTML={{ __html: html }}
        data-test-id={dataTestId}
        data-test-name={dataTestName}
        onInput={onInput}
        onKeyDown={onKeyDown}
        ref={contentEditableRef}
        tabIndex={0}
      />
      {expression && (
        <Suspense>
          <AutoCompleteList
            cursorClientX={cursorClientX}
            dataTestId={dataTestId ? `${dataTestId}-List` : undefined}
            dataTestName={dataTestName ? `${dataTestName}-List` : undefined}
            expression={expression}
            inputRef={contentEditableRef}
            onCancel={() => {
              /* no-op */
            }}
            onSubmit={onSubmit}
          />
        </Suspense>
      )}
    </>
  );
}

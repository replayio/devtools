import React from "react";
import classNames from "classnames";

import MaterialIcon from "ui/components/shared/MaterialIcon";
import escapeHtml from "escape-html";
const { getCodeMirror } = require("devtools/client/debugger/src/utils/editor/create-editor");

interface SummaryRowProps {
  isEditable: boolean;
  handleClick: (event: React.MouseEvent) => void;
  label: string | null;
  value: string;
}

function getSyntaxHighlightedMarkup(string: string) {
  let markup = "";

  getCodeMirror().runMode(string, "javascript", (text: string, className: string | null) => {
    const openingTag = className ? `<span class="cm-${className}">` : "<span>";
    markup += `${openingTag}${escapeHtml(text)}</span>`;
  });

  return markup;
}

export default function SummaryRow({ isEditable, handleClick, label, value }: SummaryRowProps) {
  return (
    <div className="flex flex-row space-x-1 items-center">
      {label ? <div className="w-6 flex-shrink-0">{label}</div> : null}
      <button
        className={classNames(
          "group flex flex-row items-top space-x-1 p-0.5",
          !isEditable ? "bg-gray-200 cursor-auto" : "group-hover:text-primaryAccent"
        )}
        disabled={!isEditable}
        onClick={handleClick}
      >
        <span className="expression">
          <span
            className={
              isEditable
                ? "border-b border-dashed border-transparent group-hover:border-primaryAccent"
                : ""
            }
          >
            <div
              className="cm-s-mozilla font-mono overflow-hidden whitespace-pre"
              dangerouslySetInnerHTML={{
                __html: getSyntaxHighlightedMarkup(value || ""),
              }}
            />
          </span>
        </span>
        {isEditable ? (
          <MaterialIcon
            className="opacity-0 group-hover:opacity-100 "
            style={{ fontSize: "0.75rem", lineHeight: "0.75rem" }}
          >
            edit
          </MaterialIcon>
        ) : null}
      </button>
    </div>
  );
}

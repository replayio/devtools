import React from "react";
import classNames from "classnames";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import escapeHtml from "escape-html";
import Popup from "./Popup";
const { getCodeMirror } = require("devtools/client/debugger/src/utils/editor/create-editor");
const { prefs } = require("ui/utils/prefs");

export interface SummaryExpressionProps {
  value: string;
  didExceedMaxHitsEditable: boolean;
  isTeamDeveloper: boolean;
}

function getSyntaxHighlightedMarkup(string: string) {
  let markup = "";

  getCodeMirror().runMode(string, "javascript", (text: string, className: string | null) => {
    const openingTag = className ? `<span class="cm-${className}">` : "<span>";
    markup += `${openingTag}${escapeHtml(text)}</span>`;
  });

  return markup;
}

function Expression({ value, isEditable }: { value: string; isEditable: boolean }) {
  return (
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
  );
}

export function SummaryExpression({
  didExceedMaxHitsEditable,
  isTeamDeveloper,
  handleClick,
  value,
}: SummaryExpressionProps & {
  handleClick: (event: React.MouseEvent) => void;
}) {
  const isEditable = didExceedMaxHitsEditable && isTeamDeveloper;

  return (
    <button
      className={classNames(
        "group flex flex-row items-top space-x-1 p-0.5",
        !isEditable ? "bg-gray-200 cursor-auto" : "group-hover:text-primaryAccent"
      )}
      disabled={!isEditable}
      onClick={handleClick}
    >
      {isEditable ? (
        <>
          <Expression {...{ value, isEditable }} />
          <MaterialIcon
            className="opacity-0 group-hover:opacity-100 "
            style={{ fontSize: "0.75rem", lineHeight: "0.75rem" }}
          >
            edit
          </MaterialIcon>
        </>
      ) : (
        <>
          <Popup trigger={<Expression {...{ value, isEditable }} />}>
            {isTeamDeveloper ? (
              "Editing logpoints is available for Developers in the Team plan"
            ) : (
              <>
                This log cannot be edited because <br />
                it was hit {prefs.maxHitsDisplayed}+ times
              </>
            )}
          </Popup>
        </>
      )}
    </button>
  );
}

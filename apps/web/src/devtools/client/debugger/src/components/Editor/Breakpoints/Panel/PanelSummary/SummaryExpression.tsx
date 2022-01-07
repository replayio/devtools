import React from "react";
import classNames from "classnames";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import escapeHtml from "escape-html";
import Popup from "./Popup";
import hooks from "ui/hooks";
const { getCodeMirror } = require("devtools/client/debugger/src/utils/editor/create-editor");
const { prefs } = require("ui/utils/prefs");

export interface SummaryExpressionProps {
  value: string;
  isEditable: boolean;
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
    <div className={classNames({ expression: true })}>
      <div
        className="cm-s-mozilla font-mono overflow-hidden whitespace-pre"
        dangerouslySetInnerHTML={{ __html: getSyntaxHighlightedMarkup(value || "") }}
      />
    </div>
  );
}

export function SummaryExpression({ isEditable, value }: SummaryExpressionProps & {}) {
  const { isTeamDeveloper } = hooks.useIsTeamDeveloper();

  return isEditable ? (
    <div className="flex group hover:text-primaryAccent space-x-1 px-2">
      <Expression value={value} isEditable={true} />
      <MaterialIcon className="opacity-0 pencil" iconSize="xs">
        edit
      </MaterialIcon>
    </div>
  ) : (
    <div className="bg-gray-200 px-2 rounded-sm">
      <Popup trigger={<Expression value={value} isEditable={false} />}>
        {isTeamDeveloper ? (
          <>
            This log cannot be edited because <br />
            it was hit {prefs.maxHitsDisplayed}+ times
          </>
        ) : (
          "Editing logpoints is available for Developers in the Team plan"
        )}
      </Popup>
    </div>
  );
}

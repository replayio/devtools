import React from "react";
import classNames from "classnames";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import escapeHtml from "escape-html";
import Popup from "./Popup";
import hooks from "ui/hooks";
const { getCodeMirror } = require("devtools/client/debugger/src/utils/editor/create-editor");
import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";

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
        className="overflow-hidden whitespace-pre cm-s-mozilla"
        dangerouslySetInnerHTML={{ __html: getSyntaxHighlightedMarkup(value || "") }}
      />
    </div>
  );
}

export function SummaryExpression({ isEditable, value }: SummaryExpressionProps & {}) {
  const { isTeamDeveloper } = hooks.useIsTeamDeveloper();

  return isEditable ? (
    <div className="flex flex-1 pr-1 space-x-1 group hover:text-primaryAccent">
      <Expression value={value} isEditable={true} />
      <MaterialIcon className="pencil" iconSize="xs">
        edit
      </MaterialIcon>
    </div>
  ) : (
    <div className="px-2 rounded-sm">
      <Popup trigger={<Expression value={value} isEditable={false} />}>
        {isTeamDeveloper ? (
          <>
            This log cannot be edited because <br />
            it was hit {MAX_POINTS_FOR_FULL_ANALYSIS}+ times
          </>
        ) : (
          "Editing logpoints is available for Developers in the Team plan"
        )}
      </Popup>
    </div>
  );
}

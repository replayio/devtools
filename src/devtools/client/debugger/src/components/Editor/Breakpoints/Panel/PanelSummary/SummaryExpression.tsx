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

function Expression({ value }: { value: string }) {
  return (
    <div className={classNames({ expression: true })}>
      <div
        className="cm-s-mozilla overflow-hidden whitespace-pre"
        dangerouslySetInnerHTML={{ __html: getSyntaxHighlightedMarkup(value || "") }}
      />
    </div>
  );
}

export function SummaryExpression({ isEditable, value }: SummaryExpressionProps & {}) {
  const { isTeamDeveloper } = hooks.useIsTeamDeveloper();

  return isEditable ? (
    <div className="group flex flex-1 space-x-1 pr-1" data-test-name="LogpointContentSummary">
      <Expression value={value} />
      <MaterialIcon className="pencil" iconSize="xs">
        edit
      </MaterialIcon>
    </div>
  ) : (
    <div className="rounded-sm px-2">
      <Popup trigger={<Expression value={value} />}>
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

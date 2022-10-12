import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import classnames from "classnames";
import { parser } from "devtools/client/debugger/src/utils/bootstrap";
import { useContext, useState } from "react";
import { Point } from "shared/client/types";
import { trackEvent } from "ui/utils/telemetry";

import { PanelInput } from "./PanelInput";

export default function PanelEditor({
  inputToFocus,
  point,
  showCondition,
  toggleEditingOff,
}: {
  inputToFocus: "condition" | "content";
  point: Point;
  showCondition: boolean;
  toggleEditingOff: () => void;
}) {
  const [content, setContent] = useState(point.content);
  const [condition, setCondition] = useState(point.condition || "");
  const [logSyntaxError, setLogSyntaxError] = useState<string | null>(null);
  const [conditionSyntaxError, setConditionSyntaxError] = useState<string | null>(null);

  const { editPoint } = useContext(PointsContext);

  const hasError = logSyntaxError !== null || conditionSyntaxError !== null;

  const savePoint = () => {
    if (hasError) {
      return;
    }

    if (!showCondition && condition !== "") {
      setCondition("");
    }

    editPoint(point.id, {
      condition: showCondition ? condition : null,
      content,
    });

    toggleEditingOff();
  };

  const onContentChange = async (value: string) => {
    trackEvent("breakpoint.set_log");
    setContent(value);
    const error = await parser.hasSyntaxError(value);
    setLogSyntaxError(error || null);
  };

  const onConditionChange = async (value: string) => {
    setCondition(value);
    trackEvent("breakpoint.set_condition");
    if (value === "") {
      setConditionSyntaxError(null);
    } else {
      const error = await parser.hasSyntaxError(value);
      setConditionSyntaxError(error || null);
    }
  };

  return (
    <div
      className={classnames("panel-editor flex flex-row items-center gap-1 rounded-sm", {
        conditional: showCondition,
      })}
    >
      <form className="relative flex flex-grow flex-col space-y-0.5">
        {showCondition ? (
          <div className="form-row">
            <div className="mr-1 w-6 flex-shrink-0">if</div>
            <PanelInput
              autofocus={inputToFocus == "condition"}
              value={condition}
              onChange={(value: string) => onConditionChange(value)}
              onEnter={savePoint}
              onEscape={toggleEditingOff}
            />
          </div>
        ) : null}
        <div className="form-row">
          {showCondition ? <div className="mr-1 w-6 flex-shrink-0">log</div> : null}
          <PanelInput
            autofocus={inputToFocus == "content"}
            value={content}
            onChange={(value: string) => onContentChange(value)}
            onEnter={savePoint}
            onEscape={toggleEditingOff}
          />
        </div>
      </form>
      <button
        type="button"
        disabled={hasError}
        onClick={savePoint}
        title={hasError ? "Syntax error" : "Save expression"}
        className={classnames(
          "inline-flex flex-shrink-0 items-center rounded-full border border-transparent p-1 px-2 font-sans text-xs font-medium leading-4 text-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primaryAccent focus-visible:ring-offset-2",
          hasError ? "cursor-default bg-gray-400" : "bg-primaryAccent hover:bg-primaryAccentHover"
        )}
      >
        Save
      </button>
    </div>
  );
}

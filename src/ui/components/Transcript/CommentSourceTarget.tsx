import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createLabels } from "ui/actions/comments";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";
import { SourceLocation } from "ui/state/comments";
import { setViewMode } from "ui/actions/layout";
const { selectLocation } = actions;

type CommentSourceTargetProps = {
  secondaryLabel?: string;
  sourceLocation: SourceLocation;
};

export const CommentSourceTarget = ({
  secondaryLabel,
  sourceLocation,
}: CommentSourceTargetProps): JSX.Element => {
  const dispatch = useDispatch();
  const threadContext = useSelector(selectors.getThreadContext);

  const [label, setLabel] = useState<string>(secondaryLabel ?? "");

  useEffect(() => {
    const updateLabels = async () => {
      // const labels = await createLabels(sourceLocation!);
      // TODO
    };

    if (!label) {
      updateLabels();
    }
  }, []);

  const onClick = () => {
    setViewMode("dev");
    trackEvent("comments.select_location");
    selectLocation(threadContext, sourceLocation);
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-md border-gray-200 bg-chrome px-2 py-0.5 hover:bg-themeTextFieldBgcolor"
    >
      <div className="mono flex flex-col font-medium">
        <div className="flex w-full flex-row justify-between space-x-1">
          <div
            className="cm-s-mozilla overflow-hidden whitespace-pre font-mono text-xs"
            style={{ fontSize: "11px" }}
            dangerouslySetInnerHTML={{ __html: label }}
          />
          <div
            className="flex flex-shrink-0 opacity-0 transition group-hover:opacity-100"
            title="Show in the Editor"
          >
            <MaterialIcon iconSize="sm">keyboard_arrow_right</MaterialIcon>
          </div>
        </div>
      </div>
    </div>
  );
};

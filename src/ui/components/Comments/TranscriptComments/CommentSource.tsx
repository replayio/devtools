import React, { useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { createLabels } from "ui/actions/comments";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";

type PropsFromParent = {
  comment: any;
};
type CommentSourceProps = PropsFromRedux & PropsFromParent;

function CommentSource({
  comment,
  createLabels,
  context,
  selectLocation,
  setViewMode,
}: CommentSourceProps) {
  const [labels, setLabels] = useState<{ primary: string | null; secondary: string | null }>({
    primary: comment.primaryLabel,
    secondary: comment.secondaryLabel,
  });

  useEffect(() => {
    async function updateLabels() {
      setLabels(await createLabels(comment.sourceLocation!));
    }
    if (comment.sourceLocation && !labels.primary && !labels.secondary) {
      updateLabels();
    }
  }, []);

  const onSelectSource = () => {
    setViewMode("dev");
    trackEvent("comments.select_location");
    selectLocation(context, comment.sourceLocation);
  };

  return (
    <div
      onClick={onSelectSource}
      className="group cursor-pointer rounded-md border-gray-200 bg-chrome px-2 py-0.5 hover:bg-themeTextFieldBgcolor"
    >
      <div className="mono flex flex-col font-medium">
        <div className="flex w-full flex-row justify-between space-x-1">
          <div
            className="cm-s-mozilla overflow-hidden whitespace-pre font-mono text-xs"
            style={{ fontSize: "11px" }}
            dangerouslySetInnerHTML={{ __html: labels.secondary || "" }}
          />
          <div
            className="flex flex-shrink-0 opacity-0 transition group-hover:opacity-100"
            // className="flex-shrink-0 p-px w-4 h-4 opacity-0 group-hover:opacity-100"
            title="Show in the Editor"
          >
            <MaterialIcon iconSize="sm">keyboard_arrow_right</MaterialIcon>
          </div>
        </div>
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    context: selectors.getThreadContext(state),
  }),
  {
    createLabels,
    selectLocation: actions.selectLocation,
    setViewMode: actions.setViewMode,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentSource);

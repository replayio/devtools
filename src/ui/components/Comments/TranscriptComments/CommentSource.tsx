import React, { useEffect, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { actions } from "ui/actions";
import { createLabels } from "ui/actions/comments";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";

type PropsFromParent = {
  comment: any;
};
type CommentSourceProps = PropsFromRedux & PropsFromParent;

type Labels = {
  primary: string | null;
  secondary: string | null;
};

function CommentSource({
  comment,
  createLabels,
  context,
  selectLocation,
  setViewMode,
}: CommentSourceProps) {
  const [labels, setLabels] = useState<Labels | null>(null);

  const sourceLocation = comment?.sourceLocation;

  useEffect(() => {
    if (sourceLocation && labels === null) {
      createLabels(sourceLocation).then(setLabels);
    }
  }, [createLabels, labels, sourceLocation]);

  const onSelectSource = () => {
    setViewMode("dev");
    trackEvent("comments.select_location");
    selectLocation(context, sourceLocation);
  };

  if (!sourceLocation) {
    return null;
  }

  let sourceContent: React.ReactNode = null;
  // We may not have sources yet, and once we have sources we still have to calculate
  // the "labels" from the source texts.  Show loading indicators until ready.
  if (labels) {
    sourceContent = (
      <div
        className="cm-s-mozilla overflow-hidden whitespace-pre font-mono text-xs"
        style={{ fontSize: "11px" }}
        dangerouslySetInnerHTML={{ __html: labels?.secondary || "" }}
      />
    );
  } else {
    sourceContent = <div className="whitespace-pre font-mono text-xs italic">Loading...</div>;
  }

  return (
    <div
      onClick={onSelectSource}
      className="group cursor-pointer rounded-md border-gray-200 bg-chrome px-2 py-0.5 hover:bg-themeTextFieldBgcolor"
    >
      <div className="mono flex flex-col font-medium">
        <div className="flex w-full flex-row justify-between space-x-1">
          {sourceContent}
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

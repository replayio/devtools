import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getAlternateSource } from "../../reducers/pause";
import { getSelectedSourceWithContent, Source } from "../../reducers/sources";
import Icon from "ui/components/shared/Icon";
import { getSourcemapVisualizerURL } from "devtools/client/debugger/src/utils/source";

function SourcemapVisualizerLink({ selectedSource, alternateSource }: PropsFromRedux) {
  const href = getSourcemapVisualizerURL(selectedSource, alternateSource);
  if (!href) {
    return null;
  }

  return (
    <div className="flex items-center pl-4">
      <a target="_blank" rel="noreferrer noopener hover:underline" href={href}>
        <Icon
          size="small"
          filename="external"
          className="cursor-pointer bg-gray-800 group-hover:bg-primaryAccent"
        />{" "}
        Source Map
      </a>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  selectedSource: getSelectedSourceWithContent(state),
  alternateSource: getAlternateSource(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(SourcemapVisualizerLink);

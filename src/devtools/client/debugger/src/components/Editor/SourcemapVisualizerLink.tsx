import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getAlternateSource } from "../../reducers/pause";
import { getSelectedSourceWithContent, Source } from "../../reducers/sources";
import Icon from "ui/components/shared/Icon";
import { getSourcemapVisualizerURL } from "devtools/client/debugger/src/utils/sourceVisualizations";
import { trackEvent } from "ui/utils/telemetry";

function SourcemapVisualizerLink({ selectedSource, alternateSource }: PropsFromRedux) {
  // @ts-ignore possible undefined mismatch
  const href = getSourcemapVisualizerURL(selectedSource, alternateSource);
  if (!href) {
    return null;
  }

  return (
    <div className=" flex items-center pl-2">
      <a
        className="hover:underline"
        target="_blank"
        rel="noreferrer noopener"
        href={href}
        onClick={() => trackEvent("editor.open_sourcemap_visualizer")}
      >
        <Icon
          size="small"
          filename="external"
          className="cursor-pointer bg-iconColor group-hover:bg-primaryAccent"
        />{" "}
      </a>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  selectedSource: getSelectedSourceWithContent(state)!,
  alternateSource: getAlternateSource(state)!,
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(SourcemapVisualizerLink);

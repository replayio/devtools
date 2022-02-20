import { ThreadFront } from "protocol/thread";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getAlternateSource } from "../../reducers/pause";
import { getSelectedSourceWithContent, Source } from "../../reducers/sources";

function getSourceToVisualize(selectedSource: Source | null, alternateSource: Source | null) {
  if (!selectedSource) {
    return undefined;
  }
  if (selectedSource.isOriginal) {
    return selectedSource.id;
  }
  if (alternateSource?.isOriginal) {
    return alternateSource.id;
  }
  if (ThreadFront.getSourceKind(selectedSource.id) === "prettyPrinted") {
    // for pretty-printed sources we show the sourcemap of the non-pretty-printed version
    return ThreadFront.getGeneratedSourceIds(selectedSource.id)?.[0];
  } else if (ThreadFront.getOriginalSourceIds(selectedSource.id)?.length) {
    return selectedSource.id;
  }
  return undefined;
}

function SourcemapVisualizerLink({ selectedSource, alternateSource }: PropsFromRedux) {
  const sourceId = getSourceToVisualize(selectedSource, alternateSource);
  if (!sourceId) {
    return null;
  }

  let href = `/recording/${ThreadFront.recordingId}/sourcemap/${sourceId}`;
  const dispatchUrl = new URL(location.href).searchParams.get("dispatch");
  if (dispatchUrl) {
    href += `?dispatch=${dispatchUrl}`;
  }

  return (
    <div className="flex items-center pl-4">
      <a target="_blank" rel="noreferrer noopener" className="underline" href={href}>
        Visualize sourcemap
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

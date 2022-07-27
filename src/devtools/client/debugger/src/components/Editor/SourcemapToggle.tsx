import { SourceId } from "@replayio/protocol";
import { ThreadFront } from "protocol/thread";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { setModal } from "ui/actions/app";
import { UIState } from "ui/state";

import actions from "../../actions";
import { getAlternateSource } from "../../reducers/pause";
import { getSelectedSource } from "ui/reducers/sources";
import { getUniqueAlternateSourceId } from "../../utils/sourceVisualizations";

import Toggle from "./Toggle";

function SourcemapError({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center space-x-1" onClick={onClick}>
      <span>No sourcemaps found.</span>
      <button className="underline">Learn more</button>
    </div>
  );
}

export function SourcemapToggle({
  selectedSource,
  alternateSource,
  setModal,
  showAlternateSource,
}: PropsFromRedux) {
  let alternateSourceId: SourceId | undefined;
  if (alternateSource) {
    alternateSourceId = alternateSource.id;
  } else {
    const result = getUniqueAlternateSourceId(selectedSource.id);
    alternateSourceId = result.sourceId;
    if (!alternateSourceId && result.why === "not-unique") {
      return null;
    }
  }

  const setEnabled = (v: React.SetStateAction<boolean>) => {
    showAlternateSource(selectedSource.id, alternateSourceId!);
  };
  const onErrorClick = () => {
    setModal("sourcemap-setup");
  };

  return (
    <label className="mapped-source flex items-center space-x-1 pt-0.5 pl-3">
      <Toggle
        enabled={ThreadFront.isSourceMappedSource(selectedSource.id)}
        setEnabled={setEnabled}
        disabled={!alternateSourceId}
      />
      {!alternateSourceId ? <SourcemapError onClick={onErrorClick} /> : <div>Show Source Map</div>}
    </label>
  );
}

const connector = connect(
  (state: UIState) => ({
    selectedSource: getSelectedSource(state)!,
    alternateSource: getAlternateSource(state),
  }),
  {
    showAlternateSource: actions.showAlternateSource,
    setModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SourcemapToggle);

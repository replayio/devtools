import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAppSelector } from "ui/setup/hooks";
import { setModal } from "ui/actions/app";
import { UIState } from "ui/state";
import { getSelectedSource } from "ui/reducers/sources";

import actions from "../../actions";

import Toggle from "./Toggle";

function SourcemapError({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center space-x-1" onClick={onClick}>
      <span>No sourcemaps found.</span>
      <button className="underline">Learn more</button>
    </div>
  );
}

export function SourcemapToggle({ setModal, showAlternateSource }: PropsFromRedux) {
  const sourceDetails = useAppSelector(getSelectedSource);
  if (!sourceDetails) {
    return null;
  }
  if (sourceDetails.generated.length !== 1) {
    return null;
  }
  const alternateSourceId = sourceDetails.generated[0];

  const setEnabled = (v: React.SetStateAction<boolean>) => {
    showAlternateSource(sourceDetails.id, alternateSourceId!);
  };
  const onErrorClick = () => {
    setModal("sourcemap-setup");
  };

  return (
    <label className="mapped-source flex items-center space-x-1 pt-0.5 pl-3">
      <Toggle
        enabled={sourceDetails.id === sourceDetails.canonicalId}
        setEnabled={setEnabled}
        disabled={!alternateSourceId}
      />
      {!alternateSourceId ? <SourcemapError onClick={onErrorClick} /> : <div>Show Source Map</div>}
    </label>
  );
}

const connector = connect(null, {
  showAlternateSource: actions.showAlternateSource,
  setModal,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(SourcemapToggle);

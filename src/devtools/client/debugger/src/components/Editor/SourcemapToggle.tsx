import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAppSelector } from "ui/setup/hooks";
import { setModal } from "ui/actions/app";
import { UIState } from "ui/state";
import { getSelectedSourceDetails } from "ui/reducers/sources";

import actions from "../../actions";
import { getSelectedSourceWithContent } from "../../reducers/sources";

import Toggle from "./Toggle";

function SourcemapError({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center space-x-1" onClick={onClick}>
      <span>No sourcemaps found.</span>
      <button className="underline">Learn more</button>
    </div>
  );
}

export function SourcemapToggle({ selectedSource, setModal, showAlternateSource }: PropsFromRedux) {
  const sourceDetails = useAppSelector(getSelectedSourceDetails);
  if (!sourceDetails) {
    return null;
  }
  console.log({ sourceDetails });
  if (sourceDetails.generated.length !== 1) {
    return null;
  }
  const alternateSourceId = sourceDetails.generated[0];

  const setEnabled = (v: React.SetStateAction<boolean>) => {
    showAlternateSource(selectedSource.id, alternateSourceId!);
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

const connector = connect(
  (state: UIState) => ({
    selectedSource: getSelectedSourceWithContent(state)!,
  }),
  {
    showAlternateSource: actions.showAlternateSource,
    setModal,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(SourcemapToggle);

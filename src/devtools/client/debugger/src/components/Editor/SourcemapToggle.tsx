import React, { useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { setModal } from "ui/actions/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getSelectedSource } from "ui/reducers/sources";

import { showAlternateSource } from "../../actions/sources/select";
import { getPauseId, getSelectedFrameId } from "../../reducers/pause";
import { getAlternateSourceIdSuspense } from "../../utils/sourceVisualizations";

import { CursorPosition } from "./Footer";
import Toggle from "./Toggle";

function SourcemapError({ why }: { why: "no-sourcemap" | "not-unique" | undefined }) {
  const dispatch = useAppDispatch();

  if (!why) {
    return null;
  }

  if (why === "no-sourcemap") {
    const onClick = () => {
      dispatch(setModal("sourcemap-setup"));
    };
    return (
      <div className="flex items-center space-x-1" onClick={onClick}>
        <span>No sourcemaps found.</span>
        <button className="underline">Learn more</button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <span>The currently selected position is not mapped</span>
    </div>
  );
}

export default function SourcemapToggle({ cursorPosition }: { cursorPosition: CursorPosition }) {
  const dispatch = useAppDispatch();
  const client = useContext(ReplayClientContext);
  const pauseId = useAppSelector(getPauseId);
  const selectedSource = useAppSelector(getSelectedSource);
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  const sourcesState = useAppSelector(state => state.sources);
  if (!pauseId) {
    return null;
  }
  const alternateSourceIdResult = getAlternateSourceIdSuspense(
    client,
    pauseId,
    selectedSource,
    selectedFrameId,
    cursorPosition,
    sourcesState
  );

  if (alternateSourceIdResult.why === "no-source") {
    return null;
  }

  const setEnabled = () => {
    if (selectedSource && alternateSourceIdResult.sourceId) {
      dispatch(showAlternateSource(selectedSource.id, alternateSourceIdResult.sourceId));
    }
  };

  const enabled = !!selectedSource?.isSourceMapped;

  return (
    <label
      className="mapped-source flex items-center space-x-1 pt-0.5 pl-3"
      data-test-id="SourceMapToggle"
      data-test-state={enabled ? "on" : "off"}
    >
      <Toggle
        enabled={enabled}
        setEnabled={setEnabled}
        disabled={!alternateSourceIdResult.sourceId}
      />
      <SourcemapError why={alternateSourceIdResult.why} />
    </label>
  );
}

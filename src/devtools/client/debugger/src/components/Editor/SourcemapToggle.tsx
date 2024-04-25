import React, { useContext } from "react";

import { useSourcesById } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { setModal } from "ui/actions/app";
import { getSelectedSourceId } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { showAlternateSource } from "../../actions/sources/select";
import { getSelectedFrameId } from "../../reducers/pause";
import { CursorPosition, getAlternateSourceIdSuspense } from "../../utils/sourceVisualizations";
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

export default function SourcemapToggleSuspends({
  cursorPosition,
}: {
  cursorPosition: CursorPosition;
}) {
  const dispatch = useAppDispatch();
  const client = useContext(ReplayClientContext);
  const selectedSourceId = useAppSelector(getSelectedSourceId);
  const sourcesById = useSourcesById(client);
  const selectedSource = selectedSourceId ? sourcesById.get(selectedSourceId) : undefined;
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  const sourcesState = useAppSelector(state => state.sources);
  const alternateSourceIdResult = getAlternateSourceIdSuspense(
    client,
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

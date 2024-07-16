import { useContext } from "react";

import { ReportProblemLink } from "replay-next/components/errors/ReportProblemLink";
import { useSourcesById } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import SourcemapSetup from "ui/components/shared/Modals/SourcemapSetup";
import { getSelectedSourceId } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { showAlternateSource } from "../../actions/sources/select";
import { getSelectedFrameId } from "../../reducers/pause";
import { CursorPosition, getAlternateSourceIdSuspense } from "../../utils/sourceVisualizations";
import Toggle from "./Toggle";

function SourcemapError({
  sourceId,
  why,
}: {
  sourceId: string | undefined;
  why: "no-sourcemap" | "not-unique" | undefined;
}) {
  const dispatch = useAppDispatch();

  if (!why) {
    return null;
  }

  if (why === "no-sourcemap") {
    return (
      <div className="flex items-center space-x-1">
        <span>No sourcemaps found.</span>
        <ReportProblemLink
          context={{ id: "source-viewer-source-maps", sourceId }}
          title={<SourcemapSetup />}
        />
      </div>
    );
  }

  return <span>The currently selected position is not mapped.</span>;
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
      className="mapped-source flex items-center space-x-2 pt-0.5 pl-3"
      data-test-id="SourceMapToggle"
      data-test-state={enabled ? "on" : "off"}
    >
      <Toggle
        enabled={enabled}
        setEnabled={setEnabled}
        disabled={!alternateSourceIdResult.sourceId}
      />
      <SourcemapError
        sourceId={alternateSourceIdResult.sourceId}
        why={alternateSourceIdResult.why}
      />
    </label>
  );
}

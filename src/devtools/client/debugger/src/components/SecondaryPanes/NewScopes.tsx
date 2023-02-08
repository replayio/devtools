import { PauseId, Value } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import Inspector from "replay-next/components/inspector/Inspector";
import ScopesInspector from "replay-next/components/inspector/ScopesInspector";
import { getFrameSuspense } from "replay-next/src/suspense/FrameCache";
import { getFrameScopesSuspense } from "replay-next/src/suspense/ScopeCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { enterFocusMode } from "ui/actions/timeline";
import { Redacted } from "ui/components/Redacted";
import { isCurrentTimeInLoadedRegion } from "ui/reducers/app";
import { getPreferredLocation, getPreferredSourceId } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { pickScopes } from "ui/suspense/scopeCache";

import { getSelectedFrameId } from "../../selectors";
import { ConvertedScope, convertScopes } from "../../utils/pause/scopes/convertScopes";
import styles from "./NewObjectInspector.module.css";

function ScopesRenderer() {
  const replayClient = useContext(ReplayClientContext);
  const sourcesState = useAppSelector(state => state.sources);
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  if (!selectedFrameId) {
    return (
      <div className="pane">
        <div className="pane-info empty">Not paused at a point with any scopes</div>
      </div>
    );
  }

  const frame = getFrameSuspense(replayClient, selectedFrameId.pauseId, selectedFrameId.frameId);
  if (!frame) {
    return null;
  }

  let path = "scope:";
  if (frame.functionLocation) {
    const functionLocation = getPreferredLocation(sourcesState, frame.functionLocation);
    path += `${functionLocation.sourceId}:${functionLocation.line}:${functionLocation.column}`;
  } else if (frame.type !== "global") {
    const sourceId = getPreferredSourceId(
      sourcesState.sourceDetails.entities,
      frame.location.map(l => l.sourceId)
    );
    path += `${sourceId}:`;
  }

  const { scopes: protocolScopes, originalScopesUnavailable } = pickScopes(
    getFrameScopesSuspense(replayClient, selectedFrameId.pauseId, selectedFrameId.frameId),
    sourcesState.preferredGeneratedSources
  );
  const scopes = convertScopes(protocolScopes, frame, selectedFrameId.pauseId);

  return (
    <>
      {originalScopesUnavailable ? (
        <div className="warning">The variables could not be mapped to their original names</div>
      ) : null}
      <div className={`${styles.Popup} preview-popup`}>
        {scopes.map((scope, scopeIndex) => (
          <Scope
            expandByDefault={scopeIndex === 0}
            key={scopeIndex}
            path={`${path}/${scopeIndex}`}
            pauseId={selectedFrameId.pauseId}
            scope={scope}
          />
        ))}
      </div>
    </>
  );
}

function Scope({
  expandByDefault,
  path,
  pauseId,
  scope,
}: {
  expandByDefault?: boolean;
  path?: string;
  pauseId: PauseId;
  scope: ConvertedScope;
}) {
  if (scope.type === "object") {
    return (
      <Inspector
        context="default"
        expandByDefault={expandByDefault}
        path={path}
        pauseId={pauseId}
        protocolValue={{ object: scope.objectId, name: scope.title } as Value}
      />
    );
  }
  if (scope.bindings) {
    return (
      <ScopesInspector
        expandByDefault={expandByDefault}
        name={scope.title!}
        path={path}
        pauseId={pauseId}
        protocolValues={scope.bindings}
      />
    );
  }
  return null;
}

export default function Scopes() {
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  const showUnloadedRegionError = !useAppSelector(isCurrentTimeInLoadedRegion);
  const dispatch = useAppDispatch();

  if (showUnloadedRegionError) {
    return (
      <div className="pane">
        <div className="pane-info empty">
          Scope is unavailable because it is outside{" "}
          <span className="cursor-pointer underline" onClick={() => dispatch(enterFocusMode())}>
            your debugging window
          </span>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="scopes-content">
      <Redacted className="pane scopes-list" data-test-name="ScopesList">
        <ErrorBoundary
          key={`${selectedFrameId?.pauseId}:${selectedFrameId?.frameId}`}
          fallback={<div className="pane-info">Error loading scopes</div>}
        >
          <Suspense fallback={<div className="pane-info">Loading…</div>}>
            <ScopesRenderer />
          </Suspense>
        </ErrorBoundary>
      </Redacted>
    </div>
  );
}

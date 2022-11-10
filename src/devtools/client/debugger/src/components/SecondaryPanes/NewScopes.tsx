import { PauseId, Value } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Inspector from "bvaughn-architecture-demo/components/inspector/Inspector";
import ScopesInspector from "bvaughn-architecture-demo/components/inspector/ScopesInspector";
import { getFrameScopesSuspense } from "bvaughn-architecture-demo/src/suspense/ScopeCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { enterFocusMode } from "ui/actions/timeline";
import { Redacted } from "ui/components/Redacted";
import { isCurrentTimeInLoadedRegion } from "ui/reducers/app";
import { getPreferredGeneratedSources } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getFrameSuspense } from "ui/suspense/frameCache";
import { pickScopes } from "ui/suspense/scopeCache";

import { getSelectedFrameId } from "../../selectors";
import { ConvertedScope, convertScopes } from "../../utils/pause/scopes/convertScopes";
import styles from "./NewObjectInspector.module.css";

function ScopesRenderer() {
  const replayClient = useContext(ReplayClientContext);
  const preferredGeneratedSources = useAppSelector(getPreferredGeneratedSources);
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  if (!selectedFrameId) {
    return (
      <div className="pane">
        <div className="pane-info empty">Not paused at a point with any scopes</div>
      </div>
    );
  }

  const frame = getFrameSuspense(replayClient, selectedFrameId);
  if (!frame) {
    return null;
  }
  const { scopes: protocolScopes, originalScopesUnavailable } = pickScopes(
    getFrameScopesSuspense(replayClient, selectedFrameId.pauseId, selectedFrameId.frameId),
    preferredGeneratedSources
  );
  const scopes = convertScopes(protocolScopes, frame, selectedFrameId.pauseId);

  return (
    <>
      {originalScopesUnavailable ? (
        <div className="warning">The variables could not be mapped to their original names</div>
      ) : null}
      <div className={`${styles.Popup} preview-popup`}>
        {scopes.map((scope, scopeIndex) => (
          <Scope key={scopeIndex} pauseId={selectedFrameId.pauseId} scope={scope} />
        ))}
      </div>
    </>
  );
}

function Scope({ pauseId, scope }: { pauseId: PauseId; scope: ConvertedScope }) {
  if (scope.type === "object") {
    return (
      <Inspector
        context="default"
        pauseId={pauseId}
        protocolValue={{ object: scope.objectId, name: scope.title } as Value}
      />
    );
  }
  if (scope.bindings) {
    return (
      <ScopesInspector name={scope.title!} pauseId={pauseId} protocolValues={scope.bindings} />
    );
  }
  return null;
}

export default function Scopes() {
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
        <ErrorBoundary fallback={<div className="pane-info">Error loading scopes</div>}>
          <Suspense fallback={<div className="pane-info">Loading…</div>}>
            <ScopesRenderer />
          </Suspense>
        </ErrorBoundary>
      </Redacted>
    </div>
  );
}

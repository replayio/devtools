import { Suspense } from "react";
import { PauseId, Value } from "@replayio/protocol";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getPauseId, getSelectedFrameId } from "../../selectors";
import { isCurrentTimeInLoadedRegion } from "ui/reducers/app";
import { enterFocusMode as enterFocusModeAction } from "ui/actions/timeline";
import { ConvertedScope, convertScopes } from "../../utils/pause/scopes/convertScopes";
import { getScopesSuspense } from "ui/suspense/scopeCache";
import { getAsyncParentFramesSuspense, getAsyncParentPauseIdSuspense } from "ui/suspense/util";
import { Redacted } from "ui/components/Redacted";
import InspectorContextReduxAdapter from "devtools/client/debugger/src/components/shared/InspectorContextReduxAdapter";
import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Inspector from "bvaughn-architecture-demo/components/inspector/Inspector";
import ScopesInspector from "bvaughn-architecture-demo/components/inspector/ScopesInspector";

import styles from "./NewObjectInspector.module.css";

function ScopesRenderer() {
  const pauseId = useAppSelector(getPauseId);
  const frameId = useAppSelector(getSelectedFrameId);
  if (!pauseId || !frameId) {
    return (
      <div className="pane">
        <div className="pane-info empty">Not paused at a point with any scopes</div>
      </div>
    );
  }

  const [asyncIndex, index] = frameId.split(":");
  const asyncPauseId = getAsyncParentPauseIdSuspense(pauseId, +asyncIndex);
  if (!asyncPauseId) {
    return null;
  }
  const frames = getAsyncParentFramesSuspense(pauseId, +asyncIndex);
  const frame = frames?.[+index];
  if (!frame) {
    return null;
  }
  const { scopes: protocolScopes, originalScopesUnavailable } = getScopesSuspense(
    asyncPauseId,
    frame.frameId
  );
  const scopes = convertScopes(protocolScopes, frame, asyncPauseId);

  return (
    <>
      {originalScopesUnavailable ? (
        <div className="warning">The variables could not be mapped to their original names</div>
      ) : null}
      <div className={`${styles.Popup} preview-popup`}>
        {scopes.map((scope, scopeIndex) => (
          <Scope key={scopeIndex} pauseId={asyncPauseId!} scope={scope} />
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
          <span className="cursor-pointer underline" onClick={() => dispatch(enterFocusModeAction)}>
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
          <InspectorContextReduxAdapter>
            <Suspense fallback={<div className="pane-info">Loading…</div>}>
              <ScopesRenderer />
            </Suspense>
          </InspectorContextReduxAdapter>
        </ErrorBoundary>
      </Redacted>
    </div>
  );
}

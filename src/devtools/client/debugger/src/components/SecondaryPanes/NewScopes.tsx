import { PauseId, Value } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import Inspector from "replay-next/components/inspector/Inspector";
import ScopesInspector from "replay-next/components/inspector/ScopesInspector";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { useIsPointWithinFocusWindow } from "replay-next/src/hooks/useIsPointWithinFocusWindow";
import { getFrameSuspense } from "replay-next/src/suspense/FrameCache";
import { frameScopesCache } from "replay-next/src/suspense/ScopeCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { getPreferredLocation, getPreferredSourceId } from "replay-next/src/utils/sources";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { enterFocusMode } from "ui/actions/timeline";
import { Redacted } from "ui/components/Redacted";
import { getPreferredGeneratedSources } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { pickScopes } from "ui/suspense/scopeCache";

import { getSeekLock, getSelectedFrameId } from "../../selectors";
import { ConvertedScope, convertScopes } from "../../utils/pause/scopes/convertScopes";
import styles from "./NewObjectInspector.module.css";

function LoadingInfo() {
  return <div className="pane-info">Loading…</div>;
}

function ScopesRenderer() {
  const replayClient = useContext(ReplayClientContext);
  const sourcesById = sourcesByIdCache.read(replayClient);
  const preferredGeneratedSources = useAppSelector(getPreferredGeneratedSources);
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  const seekLock = useAppSelector(getSeekLock);

  if (seekLock) {
    return <LoadingInfo />;
  }

  if (!selectedFrameId) {
    return (
      <div className="pane pane-info">
        <div className={styles.Empty}>Not paused at a point with any scopes</div>
      </div>
    );
  }

  const frame = getFrameSuspense(replayClient, selectedFrameId.pauseId, selectedFrameId.frameId);
  if (!frame) {
    return null;
  }

  let path = "scope:";
  if (frame.functionLocation) {
    const functionLocation = getPreferredLocation(
      sourcesById,
      preferredGeneratedSources,
      frame.functionLocation
    );
    path += `${functionLocation.sourceId}:${functionLocation.line}:${functionLocation.column}`;
  } else if (frame.type !== "global") {
    const sourceId = getPreferredSourceId(
      sourcesById,
      frame.location.map(l => l.sourceId)
    );
    path += `${sourceId}:`;
  }

  const { scopes: protocolScopes, originalScopesUnavailable } = pickScopes(
    frameScopesCache.read(replayClient, selectedFrameId.pauseId, selectedFrameId.frameId),
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

export default function NewScopes() {
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  const dispatch = useAppDispatch();

  const { executionPoint } = useContext(TimelineContext);
  const isPointWithinFocusWindow = useIsPointWithinFocusWindow(executionPoint);

  if (!isPointWithinFocusWindow) {
    return (
      <div className="pane">
        <div className="pane-info empty">
          Scope is unavailable because it is outside of the{" "}
          <span className="cursor-pointer underline" onClick={() => dispatch(enterFocusMode())}>
            focus window
          </span>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="scopes-content">
      <Redacted className="pane scopes-list" data-test-name="ScopesList">
        <InlineErrorBoundary
          name="NewScopes"
          key={`${selectedFrameId?.pauseId}:${selectedFrameId?.frameId}`}
          fallback={<div className="pane-info">Error loading scopes</div>}
        >
          <Suspense fallback={<LoadingInfo />}>
            <ScopesRenderer />
          </Suspense>
        </InlineErrorBoundary>
      </Redacted>
    </div>
  );
}

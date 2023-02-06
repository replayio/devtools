import { TimeStampedPoint } from "@replayio/protocol";
import {
  Suspense,
  unstable_useCacheRefresh as useCacheRefresh,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";

import { assert } from "protocol/utils";
import AvatarImage from "replay-next/components/AvatarImage";
import Icon from "replay-next/components/Icon";
import CodeEditor from "replay-next/components/lexical/CodeEditor";
import {
  COMMENT_TYPE_SOURCE_CODE,
  createTypeDataForSourceCodeComment,
} from "replay-next/components/sources/utils/comments";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { PointsContext } from "replay-next/src/contexts/PointsContext";
import { PauseAndFrameId } from "replay-next/src/contexts/SelectedFrameContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { getHitPointsForLocationSuspense } from "replay-next/src/suspense/ExecutionPointsCache";
import { getFramesSuspense } from "replay-next/src/suspense/FrameCache";
import { getPauseIdSuspense } from "replay-next/src/suspense/PauseCache";
import { getSource } from "replay-next/src/suspense/SourcesCache";
import { findIndexBigInt } from "replay-next/src/utils/array";
import { validate } from "replay-next/src/utils/points";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  HitPointStatus,
  POINT_BEHAVIOR_DISABLED_TEMPORARILY,
  POINT_BEHAVIOR_ENABLED,
  Point,
} from "shared/client/types";
import { addComment as addCommentGraphQL } from "shared/graphql/Comments";
import { Nag } from "shared/graphql/types";
import { isThennable } from "shared/proxy/utils";

import Loader from "../../Loader";
import { SetLinePointState } from "../SourceListRow";
import SyntaxHighlightedLine from "../SyntaxHighlightedLine";
import BadgePicker from "./BadgePicker";
import CommentButton from "./CommentButton";
import HitPointTimeline from "./HitPointTimeline";
import styles from "./LogPointPanel.module.css";

type EditReason = "condition" | "content";

type ExternalProps = {
  className: string;
  point: Point;
  setLinePointState: SetLinePointState;
};

type InternalProps = ExternalProps & {
  enterFocusMode: () => void;
  hitPoints: TimeStampedPoint[];
  hitPointStatus: HitPointStatus;
};

export default function PointPanelWrapper(props: ExternalProps) {
  const { className, point } = props;
  return (
    <Suspense
      fallback={
        <Loader
          className={`${styles.Loader} ${className}`}
          style={{
            height: point.condition
              ? "var(--point-panel-with-conditional-height)"
              : "var(--point-panel-height)",
          }}
        />
      }
    >
      <PointPanel {...props} />
    </Suspense>
  );
}

function PointPanel(props: ExternalProps) {
  const { point } = props;

  const { enterFocusMode, range: focusRange } = useContext(FocusContext);

  const client = useContext(ReplayClientContext);

  const [hitPoints, hitPointStatus] = getHitPointsForLocationSuspense(
    client,
    {
      column: point.columnIndex,
      line: point.lineNumber,
      sourceId: point.sourceId,
    },
    point.condition,
    focusRange
  );

  return (
    <PointPanelWithHitPoints
      {...props}
      enterFocusMode={enterFocusMode}
      hitPoints={hitPoints}
      hitPointStatus={hitPointStatus}
    />
  );
}

function PointPanelWithHitPoints({
  className,
  enterFocusMode,
  hitPoints,
  hitPointStatus,
  point,
  setLinePointState,
}: InternalProps) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { showCommentsPanel } = useContext(InspectorContext);
  const { editPoint, editPointBehavior, pointBehaviors } = useContext(PointsContext);
  const client = useContext(ReplayClientContext);
  const { accessToken, currentUserInfo, recordingId, trackEvent } = useContext(SessionContext);
  const { executionPoint: currentExecutionPoint, time: currentTime } = useContext(TimelineContext);

  const editable = point.user?.id === currentUserInfo?.id;

  const [showEditBreakpointNag, dismissEditBreakpointNag] = useNag(Nag.FIRST_BREAKPOINT_EDIT);

  const invalidateCache = useCacheRefresh();

  const [isEditing, setIsEditing] = useState(showEditBreakpointNag);
  const [editReason, setEditReason] = useState<EditReason | null>(null);

  const [isPending, startTransition] = useTransition();

  const [editableCondition, setEditableCondition] = useState(point.condition);
  const [editableContent, setEditableContent] = useState(point.content);

  const isContentValid = useMemo(
    () => !!editableContent && validate(editableContent),
    [editableContent]
  );
  const isConditionValid = useMemo(
    () => editableCondition === null || validate(editableCondition),
    [editableCondition]
  );
  const hasChanged = editableCondition !== point.condition || editableContent !== point.content;

  const lineNumber = point.lineNumber;

  // Log point code suggestions should always be relative to location of the the point panel.
  // This is a more intuitive experience than using the current execution point,
  // which may be paused at a different location.
  const closestHitPoint = useMemo(() => {
    const executionPoints = hitPoints.map(hitPoint => hitPoint.point);
    const index = findIndexBigInt(executionPoints, currentExecutionPoint, false);
    return hitPoints[index] || null;
  }, [hitPoints, currentExecutionPoint]);

  // If we've found a hit point match, use data from its scope.
  // Otherwise fall back to using the global execution point.
  const executionPoint = closestHitPoint ? closestHitPoint.point : currentExecutionPoint;
  const time = closestHitPoint ? closestHitPoint.time : currentTime;
  let pauseAndFrameId: PauseAndFrameId | null = null;
  try {
    const pauseId = getPauseIdSuspense(client, executionPoint, time);
    const frames = getFramesSuspense(client, pauseId);
    const frameId = frames?.[0]?.frameId ?? null;
    if (frameId !== null) {
      pauseAndFrameId = {
        frameId,
        pauseId,
      };
    }
  } catch (errorOrPromise) {
    if (isThennable(errorOrPromise)) {
      throw errorOrPromise;
    }
    console.error(`Failed to fetch frames for point ${executionPoint}`, errorOrPromise);
  }

  let source = getSource(client, point.sourceId);
  if (source?.kind === "prettyPrinted") {
    assert(
      source.generatedSourceIds,
      `pretty-printed source ${point.sourceId} has no generatedSourceIds`
    );
    source = getSource(client, source.generatedSourceIds[0]);
  }
  const context =
    source?.kind === "sourceMapped" ? "logpoint-original-source" : "logpoint-generated-source";

  const pointBehavior = pointBehaviors.get(point.id);
  const shouldLog = pointBehavior?.shouldLog === POINT_BEHAVIOR_ENABLED;

  const hasCondition = isEditing ? editableCondition !== null : point.condition !== null;
  const lineIndex = point.lineNumber - 1;

  const toggleCondition = () => {
    if (!editable) {
      return;
    }

    if (hasCondition) {
      if (isEditing) {
        setEditableCondition(null);
      } else {
        editPoint(point.id, { ...point, condition: null, content: editableContent });
      }

      setLinePointState(lineIndex, "point");
    } else {
      if (!isEditing) {
        startEditing("condition");
      }
      setEditableCondition("");
      setLinePointState(lineIndex, "point-with-conditional");
    }
  };

  const toggleShouldLog = () => {
    editPointBehavior(point.id, {
      shouldLog: shouldLog ? POINT_BEHAVIOR_DISABLED_TEMPORARILY : POINT_BEHAVIOR_ENABLED,
    });
  };

  let showTooManyPointsMessage = false;
  switch (hitPointStatus) {
    case "too-many-points-to-find":
    case "too-many-points-to-run-analysis":
    case "unknown-error":
      showTooManyPointsMessage = true;
      break;
  }

  const startEditing = (editReason: EditReason | null = null) => {
    if (isEditing || !editable) {
      return;
    }

    trackEvent("breakpoint.start_edit");
    setEditableCondition(point.condition || null);
    setEditableContent(point.content);
    setIsEditing(true);
    setEditReason(editReason);
    setLinePointState(lineIndex, point.condition !== null ? "point-with-conditional" : "point");
  };

  const addComment = () => {
    if (accessToken === null) {
      return;
    }

    startTransition(async () => {
      if (showCommentsPanel !== null) {
        showCommentsPanel();
      }
      trackEvent("breakpoint.add_comment");

      const typeData = await createTypeDataForSourceCodeComment(
        client,
        point.sourceId,
        point.lineNumber,
        point.columnIndex
      );

      await addCommentGraphQL(graphQLClient, accessToken, recordingId, {
        content: "",
        hasFrames: true,
        isPublished: false,
        point: currentExecutionPoint,
        time: currentTime,
        type: COMMENT_TYPE_SOURCE_CODE,
        typeData,
      });

      invalidateCache();
    });
  };

  const onCancel = () => {
    setEditableContent(point.content);
    setEditableCondition(point.condition);
    setIsEditing(false);
    setLinePointState(lineIndex, point.condition !== null ? "point-with-conditional" : "point");
  };

  const onEditableContentChange = (newContent: string) => {
    trackEvent("breakpoint.set_log");
    setEditableContent(newContent);
  };

  const onEditableConditionChange = (newCondition: string) => {
    trackEvent("breakpoint.set_condition");
    setEditableCondition(newCondition);
  };

  const onSubmit = () => {
    if (isConditionValid && isContentValid && hasChanged) {
      editPoint(point.id, {
        badge: point.badge,
        condition: editableCondition || null,
        content: editableContent,
      });
    }
    setIsEditing(false);
    dismissEditBreakpointNag();
  };

  const saveButton = (
    <SaveButton
      disabled={isPending || !isConditionValid || !isContentValid}
      invalid={!isConditionValid || !isContentValid}
      onClick={onSubmit}
    />
  );

  const addCommentButton = accessToken !== null && (
    <CommentButton disabled={isPending} hitPoints={hitPoints} onClick={addComment} />
  );

  const contentSpacer = accessToken !== null && <div className={styles.ContentButtonSpacer} />;

  return (
    <div
      className={`${styles.Panel} ${className}`}
      data-test-id={`PointPanel-${lineNumber}`}
      data-test-state={isEditing ? "edit" : "view"}
    >
      {
        hasCondition && (
          <div className={styles.EditableContentWrapperRow}>
            <div
              className={isConditionValid ? styles.ContentWrapper : styles.ContentWrapperInvalid}
              data-logging-disabled={!shouldLog || !editable || undefined}
              onClick={
                showTooManyPointsMessage && editable ? undefined : () => startEditing("condition")
              }
            >
              <div
                className={styles.ConditionalIconWrapper}
                data-invalid={!isConditionValid || undefined}
              >
                <Icon className={styles.ConditionalIcon} type="conditional" />
              </div>

              {isEditing ? (
                <div className={styles.Content}>
                  <div
                    className={
                      showEditBreakpointNag ? styles.ContentInputWithNag : styles.ContentInput
                    }
                  >
                    <CodeEditor
                      allowWrapping={false}
                      autoFocus={editReason === "condition"}
                      autoSelect={editReason === "condition"}
                      context={context}
                      dataTestId={`PointPanel-ConditionInput-${lineNumber}`}
                      dataTestName="PointPanel-ConditionInput"
                      editable={editable}
                      initialValue={editableCondition || ""}
                      onCancel={onCancel}
                      onChange={onEditableConditionChange}
                      onSave={onSubmit}
                      pauseAndFrameId={pauseAndFrameId}
                    />
                  </div>

                  <RemoveConditionalButton
                    disabled={isPending}
                    invalid={!isConditionValid}
                    onClick={toggleCondition}
                  />
                </div>
              ) : (
                <>
                  <div className={styles.Content}>
                    <SyntaxHighlightedLine code={point.condition!} />
                  </div>

                  <RemoveConditionalButton
                    disabled={isPending}
                    invalid={!isConditionValid}
                    onClick={toggleCondition}
                  />
                </>
              )}
            </div>

            {isEditing ? saveButton : addCommentButton}
          </div>
        ) /* hasCondition */
      }

      <div className={styles.EditableContentWrapperRow}>
        {showTooManyPointsMessage ? (
          <div className={styles.ContentWrapperTooManyPoints}>
            Use{""}
            <span className={styles.FocusModeLink} onClick={enterFocusMode}>
              Focus Mode
            </span>{" "}
            to reduce the number of hits.
          </div>
        ) : (
          <div
            className={isContentValid ? styles.ContentWrapper : styles.ContentWrapperInvalid}
            data-logging-disabled={!shouldLog || !editable || undefined}
            onClick={
              showTooManyPointsMessage && editable ? undefined : () => startEditing("content")
            }
          >
            <BadgePicker disabled={!editable} invalid={!isContentValid} point={point} />

            {isEditing ? (
              <div className={styles.Content}>
                <div
                  className={
                    showEditBreakpointNag ? styles.ContentInputWithNag : styles.ContentInput
                  }
                >
                  <CodeEditor
                    allowWrapping={false}
                    autoFocus={showEditBreakpointNag || editReason === "content"}
                    autoSelect={editReason === "content"}
                    context={context}
                    dataTestId={`PointPanel-ContentInput-${lineNumber}`}
                    dataTestName="PointPanel-ContentInput"
                    editable={editable}
                    initialValue={editableContent}
                    onCancel={onCancel}
                    onChange={onEditableContentChange}
                    onSave={onSubmit}
                    pauseAndFrameId={pauseAndFrameId}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className={styles.Content}>
                  <SyntaxHighlightedLine code={point.content} />
                </div>
                {editable ? (
                  <button
                    className={styles.EditButton}
                    disabled={isPending}
                    data-test-name="PointPanel-EditButton"
                  >
                    <Icon
                      className={styles.EditButtonIcon}
                      type={shouldLog ? "edit" : "toggle-off"}
                    />
                  </button>
                ) : (
                  <div className={styles.DisabledIconAndAvatar}>
                    <Icon className={styles.EditButtonIcon} type="toggle-off" />
                    <AvatarImage
                      className={styles.CreatedByAvatar}
                      src={point.user?.picture || undefined}
                      title={point.user?.name || undefined}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {hasCondition ? contentSpacer : isEditing ? saveButton : addCommentButton}
      </div>

      <div className={styles.TimelineWrapperRow}>
        <HitPointTimeline
          hasConditional={hasCondition}
          hitPoints={hitPoints}
          hitPointStatus={hitPointStatus}
          point={point}
          shouldLog={shouldLog}
          toggleConditional={toggleCondition}
          toggleShouldLog={toggleShouldLog}
        />
      </div>
    </div>
  );
}

function RemoveConditionalButton({
  disabled,
  invalid,
  onClick,
}: {
  disabled: boolean;
  invalid: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={styles.RemoveConditionalButton}
      data-invalid={invalid || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className={styles.RemoveConditionalButtonIcon} type="remove-alternate" />
    </button>
  );
}

function SaveButton({
  disabled,
  invalid,
  onClick,
}: {
  disabled: boolean;
  invalid: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={styles.SaveButton}
      data-invalid={invalid || undefined}
      data-test-name="PointPanel-SaveButton"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className={styles.SaveButtonIcon} type="check" />
    </button>
  );
}

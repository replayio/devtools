import { TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";
import {
  MouseEvent,
  Suspense,
  unstable_useCacheRefresh as useCacheRefresh,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useImperativeCacheValue } from "suspense";

import { assert } from "protocol/utils";
import AvatarImage from "replay-next/components/AvatarImage";
import Icon from "replay-next/components/Icon";
import CodeEditor from "replay-next/components/lexical/CodeEditor";
import {
  COMMENT_TYPE_SOURCE_CODE,
  createTypeDataForSourceCodeComment,
} from "replay-next/components/sources/utils/comments";
import { SyntaxHighlighter } from "replay-next/components/SyntaxHighlighter/SyntaxHighlighter";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { PointsContext } from "replay-next/src/contexts/points/PointsContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { hitPointsForLocationCache } from "replay-next/src/suspense/HitPointsCache";
import { getSourceSuspends } from "replay-next/src/suspense/SourcesCache";
import { findIndexBigInt } from "replay-next/src/utils/array";
import { validateCode } from "replay-next/src/utils/code";
import { MAX_POINTS_TO_RUN_EVALUATION } from "shared/client/ReplayClient";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  HitPointStatus,
  HitPointsAndStatusTuple,
  POINT_BEHAVIOR_DISABLED_TEMPORARILY,
  POINT_BEHAVIOR_ENABLED,
  Point,
} from "shared/client/types";
import { addComment as addCommentGraphQL } from "shared/graphql/Comments";
import { Nag } from "shared/graphql/types";

import Loader from "../../Loader";
import BadgePicker from "./BadgePicker";
import CommentButton from "./CommentButton";
import HitPointTimeline from "./HitPointTimeline";
import styles from "./LogPointPanel.module.css";

type EditReason = "condition" | "content";

type ExternalProps = {
  className: string;
  pointWithPendingEdits: Point;
  pointForSuspense: Point;
};

type InternalProps = ExternalProps & {
  enterFocusMode: () => void;
  hitPoints: TimeStampedPoint[];
  hitPointStatus: HitPointStatus | null;
  setFocusToBeginning: () => void;
  setFocusToEnd: () => void;
};

export default function PointPanelWrapper(props: ExternalProps) {
  const { className, pointWithPendingEdits } = props;

  const { range: focusRange } = useContext(FocusContext);
  if (!focusRange) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <Loader
          className={`${styles.Loader} ${className}`}
          style={{
            height: pointWithPendingEdits.condition
              ? "var(--point-panel-with-conditional-height)"
              : "var(--point-panel-height)",
          }}
        />
      }
    >
      <PointPanel focusRange={focusRange} {...props} />
    </Suspense>
  );
}

const EMPTY_ARRAY: any[] = [];

function PointPanel(props: ExternalProps & { focusRange: TimeStampedPointRange }) {
  const { focusRange, pointForSuspense } = props;

  const { enterFocusMode, update } = useContext(FocusContext);

  const client = useContext(ReplayClientContext);

  const { value } = useImperativeCacheValue(
    hitPointsForLocationCache,
    client,
    { begin: focusRange.begin.point, end: focusRange.end.point },
    pointForSuspense.location,
    pointForSuspense.condition
  );

  const hitPoints = (value?.[0] ?? EMPTY_ARRAY) as HitPointsAndStatusTuple[0];
  const hitPointStatus = value?.[1] ?? null;

  const setFocusToBeginning = () => {
    const hitPoint = hitPoints[MAX_POINTS_TO_RUN_EVALUATION - 1];
    if (hitPoint) {
      update(
        {
          begin: focusRange.begin,
          end: hitPoint,
        },
        {
          bias: "begin",
          sync: true,
        }
      );
    }
  };

  const setFocusToEnd = () => {
    const hitPoint = hitPoints[hitPoints.length - MAX_POINTS_TO_RUN_EVALUATION];
    if (hitPoint) {
      update(
        {
          begin: hitPoint,
          end: focusRange.end,
        },
        {
          bias: "end",
          sync: true,
        }
      );
    }
  };

  return (
    <PointPanelWithHitPoints
      {...props}
      enterFocusMode={enterFocusMode}
      hitPoints={hitPoints}
      hitPointStatus={hitPointStatus}
      setFocusToBeginning={setFocusToBeginning}
      setFocusToEnd={setFocusToEnd}
    />
  );
}

function PointPanelWithHitPoints({
  className,
  enterFocusMode,
  hitPoints,
  hitPointStatus,
  pointWithPendingEdits,
  pointForSuspense,
  setFocusToBeginning,
  setFocusToEnd,
}: InternalProps) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { showCommentsPanel } = useContext(InspectorContext);
  const {
    discardPendingPointText,
    editPendingPointText,
    editPointBehavior,
    pointBehaviorsForDefaultPriority: pointBehaviors,
    savePendingPointText,
  } = useContext(PointsContext);
  const client = useContext(ReplayClientContext);
  const { accessToken, currentUserInfo, recordingId, trackEvent } = useContext(SessionContext);
  const { executionPoint: currentExecutionPoint, time: currentTime } = useContext(TimelineContext);

  // Most of this component should use default priority Point values.
  // Only parts that may suspend should use lower priority values.
  const { condition, content, key, location, user } = pointWithPendingEdits;

  const editable = user?.id === currentUserInfo?.id;

  const [showEditBreakpointNag, dismissEditBreakpointNag] = useNag(Nag.FIRST_BREAKPOINT_EDIT);

  const invalidateCache = useCacheRefresh();

  const [isEditing, setIsEditing] = useState(showEditBreakpointNag);
  const [editReason, setEditReason] = useState<EditReason | null>(null);

  const [isPending, startTransition] = useTransition();

  const isContentValid = useMemo(() => !isEditing || validateCode(content), [isEditing, content]);
  const isConditionValid = useMemo(
    () => !isEditing || condition === null || validateCode(condition),
    [isEditing, condition]
  );

  const lineNumber = location.line;

  // Log point code suggestions should always be relative to location of the the point panel.
  // This is a more intuitive experience than using the current execution point,
  // which may be paused at a different location.
  const closestHitPoint = useMemo(() => {
    if (!currentExecutionPoint) {
      return null;
    }
    const executionPoints = hitPoints.map(hitPoint => hitPoint.point);
    const index = findIndexBigInt(executionPoints, currentExecutionPoint, false);
    return hitPoints[index] || null;
  }, [hitPoints, currentExecutionPoint]);

  // If we've found a hit point match, use data from its scope.
  // Otherwise fall back to using the global execution point.
  const executionPoint = closestHitPoint ? closestHitPoint.point : currentExecutionPoint;
  const time = closestHitPoint ? closestHitPoint.time : currentTime;

  let source = getSourceSuspends(client, location.sourceId);
  if (source?.kind === "prettyPrinted") {
    assert(
      source.generated.length > 0,
      `pretty-printed source ${location.sourceId} has no generatedSourceIds`
    );
    source = getSourceSuspends(client, source.generated[0]);
  }
  const context =
    source?.kind === "sourceMapped" ? "logpoint-original-source" : "logpoint-generated-source";

  const pointBehavior = pointBehaviors[key];
  const shouldLog = pointBehavior?.shouldLog === POINT_BEHAVIOR_ENABLED;

  const hasCondition = condition !== null;

  const toggleCondition = () => {
    if (!editable) {
      return;
    }

    if (hasCondition) {
      editPendingPointText(key, { condition: null });

      // TODO [FE-1886] Also save the point; otherwise this change won't be applied on reload
    } else {
      if (!isEditing) {
        startEditing("condition");
      }
      editPendingPointText(key, { condition: "" });
    }
  };

  const toggleShouldLog = () => {
    editPointBehavior(
      key,
      {
        shouldLog: shouldLog ? POINT_BEHAVIOR_DISABLED_TEMPORARILY : POINT_BEHAVIOR_ENABLED,
      },
      user?.id === currentUserInfo?.id
    );
  };

  const onClickEyeIcon = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    toggleShouldLog();
  };

  let showTooManyPointsErrorMessage = false;
  let showUnknownErrorMessage = false;
  switch (hitPointStatus) {
    case "too-many-points-to-find":
    case "too-many-points-to-run-analysis":
      showTooManyPointsErrorMessage = true;
      break;
    case "unknown-error":
      showUnknownErrorMessage = true;
      // What to do here?
      break;
  }

  const startEditing = (editReason: EditReason | null = null) => {
    if (isEditing || !editable) {
      return;
    }

    trackEvent("breakpoint.start_edit");
    setIsEditing(true);
    setEditReason(editReason);
  };

  const addComment = () => {
    if (accessToken === null || !currentExecutionPoint) {
      return;
    }

    startTransition(async () => {
      if (showCommentsPanel !== null) {
        showCommentsPanel();
      }
      trackEvent("breakpoint.add_comment");

      const typeData = await createTypeDataForSourceCodeComment(
        client,
        location.sourceId,
        location.line,
        location.column
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
    setIsEditing(false);
    discardPendingPointText(key);
  };

  const onEditableContentChange = (newContent: string) => {
    trackEvent("breakpoint.set_log");
    editPendingPointText(key, { content: newContent });
  };

  const onEditableConditionChange = (newCondition: string) => {
    trackEvent("breakpoint.set_condition");
    editPendingPointText(key, { condition: newCondition });
  };

  const onSubmit = () => {
    if (isConditionValid && isContentValid) {
      setIsEditing(false);
      savePendingPointText(key);
      dismissEditBreakpointNag();
    }
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
              data-state-editable={editable}
              data-state-logging-enabled={shouldLog}
              data-test-name="PointPanel-ConditionalWrapper"
              onClick={() => startEditing("condition")}
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
                      executionPoint={executionPoint}
                      initialValue={condition || ""}
                      onCancel={onCancel}
                      onChange={onEditableConditionChange}
                      onSave={onSubmit}
                      time={time}
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
                    <SyntaxHighlighter code={condition!} fileExtension=".js" />
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
        {showTooManyPointsErrorMessage ? (
          <div
            className={styles.ContentWrapperTooManyPoints}
            data-test-name="PointPanel-ErrorMessage"
          >
            {hitPointStatus === "too-many-points-to-find" ? (
              <div>
                Use{" "}
                <span
                  className={styles.FocusModeLink}
                  data-test-name="LogPointPanel-FocusModeLink"
                  onClick={enterFocusMode}
                >
                  Focus Mode
                </span>{" "}
                to reduce the number of hits.
              </div>
            ) : (
              <div>
                Too many hits.{" "}
                <span
                  className={styles.FocusModeLink}
                  data-test-name="LogPointPanel-FocusOnStartLink"
                  onClick={setFocusToBeginning}
                >
                  Focus at start
                </span>{" "}
                or{" "}
                <span
                  className={styles.FocusModeLink}
                  data-test-name="LogPointPanel-FocusOnEndLink"
                  onClick={setFocusToEnd}
                >
                  focus on end
                </span>
                .
              </div>
            )}
          </div>
        ) : showUnknownErrorMessage ? (
          <div className={styles.ContentWrapperTooManyPoints}>Failed to calculate hit points.</div>
        ) : (
          <div
            className={isContentValid ? styles.ContentWrapper : styles.ContentWrapperInvalid}
            data-state-editable={editable}
            data-state-logging-enabled={shouldLog}
            data-test-name="PointPanel-ContentWrapper"
            onClick={() => startEditing("content")}
          >
            <BadgePicker
              disabled={!editable}
              invalid={!isContentValid}
              point={pointWithPendingEdits}
            />

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
                    executionPoint={executionPoint}
                    initialValue={content}
                    onCancel={onCancel}
                    onChange={onEditableContentChange}
                    onSave={onSubmit}
                    time={time}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className={styles.Content}>
                  <SyntaxHighlighter code={content} fileExtension=".js" />
                </div>
                <div className={styles.DisabledIconAndAvatar}>
                  {shouldLog || (
                    <button className={styles.ToggleVisibilityButton} onClick={onClickEyeIcon}>
                      <Icon className={styles.ToggleVisibilityButtonIcon} type="toggle-off" />
                    </button>
                  )}
                  {editable && (
                    <button
                      className={styles.EditButton}
                      data-test-name="PointPanel-EditButton"
                      disabled={isPending}
                    >
                      <Icon className={styles.EditButtonIcon} type="edit" />
                    </button>
                  )}
                  <AvatarImage
                    className={styles.CreatedByAvatar}
                    src={user?.picture || undefined}
                    title={user?.name || undefined}
                  />
                </div>
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
          point={pointForSuspense}
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

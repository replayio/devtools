import {
  MouseEvent,
  Suspense,
  unstable_useCacheRefresh as useCacheRefresh,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";

import Icon from "bvaughn-architecture-demo/components/Icon";
import CodeEditor from "bvaughn-architecture-demo/components/lexical/CodeEditor";
import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { GraphQLClientContext } from "bvaughn-architecture-demo/src/contexts/GraphQLClientContext";
import { InspectorContext } from "bvaughn-architecture-demo/src/contexts/InspectorContext";
import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SessionContext } from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { TimelineContext } from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import { addComment as addCommentGraphQL } from "bvaughn-architecture-demo/src/graphql/Comments";
import { Nag } from "bvaughn-architecture-demo/src/graphql/types";
import { useNag } from "bvaughn-architecture-demo/src/hooks/useNag";
import { getHitPointsForLocationSuspense } from "bvaughn-architecture-demo/src/suspense/PointsCache";
import { validate } from "bvaughn-architecture-demo/src/utils/points";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";

import Loader from "../Loader";
import BadgePicker from "./BadgePicker";
import CommentButton from "./CommentButton";
import PointPanelTimeline from "./PointPanelTimeline";
import SyntaxHighlightedLine from "./SyntaxHighlightedLine";
import styles from "./PointPanel.module.css";

type EditReason = "condition" | "content";

export default function SourcePanelWrapper({
  className,
  point,
}: {
  className: string;
  point: Point;
}) {
  return (
    <Suspense fallback={<Loader className={`${styles.Loader} ${className}`} />}>
      <PointPanel className={className} point={point} />
    </Suspense>
  );
}

function PointPanel({ className, point }: { className: string; point: Point }) {
  const { range: focusRange } = useContext(FocusContext);
  const graphQLClient = useContext(GraphQLClientContext);
  const { showCommentsPanel } = useContext(InspectorContext);
  const { editPoint } = useContext(PointsContext);
  const client = useContext(ReplayClientContext);
  const { accessToken, recordingId, trackEvent } = useContext(SessionContext);
  const { executionPoint: currentExecutionPoint, time: curentTime } = useContext(TimelineContext);

  const [showEditBreakpointNag, dismissEditBreakpointNag] = useNag(Nag.FIRST_BREAKPOINT_EDIT);

  const [hitPoints, hitPointStatus] = getHitPointsForLocationSuspense(
    client,
    point.location,
    null,
    focusRange
  );

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

  const lineNumber = point.location.line;

  // Prevent hovers over syntax highlighted tokens from showing preview popups.
  const onMouseMove = (event: MouseEvent) => {
    event.preventDefault();
  };

  if (isEditing) {
    const hasCondition = editableCondition !== null;

    const onCancel = () => {
      setEditableContent(point.content);
      setEditableCondition(point.condition);
      setIsEditing(false);
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
        editPoint(point.id, { condition: editableCondition || null, content: editableContent });
      }
      setIsEditing(false);
      dismissEditBreakpointNag();
    };

    const onAddConditionClick = () => {
      setEditableCondition("");
    };

    return (
      <div
        className={`${styles.Panel} ${className}`}
        data-test-id={`PointPanel-${lineNumber}`}
        onMouseMove={onMouseMove}
      >
        <div className={styles.LayoutRow}>
          <div className={styles.MainColumn}>
            {hasCondition && (
              <div className={styles.FixedHeightRow}>
                <div className={styles.ContentPrefixLabel}>if</div>
                <div
                  className={
                    isConditionValid ? styles.ContentWrapper : styles.ContentWrapperInvalid
                  }
                >
                  <div className={styles.Content}>
                    <div
                      className={
                        showEditBreakpointNag ? styles.ContentInputWithNag : styles.ContentInput
                      }
                    >
                      <CodeEditor
                        autoFocus={editReason === "condition"}
                        dataTestId={`PointPanel-ConditionInput-${lineNumber}`}
                        dataTestName="PointPanel-ConditionInput"
                        editable={true}
                        initialValue={editableCondition}
                        onCancel={onCancel}
                        onChange={onEditableConditionChange}
                        onSave={onSubmit}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className={styles.FixedHeightRow}>
              {hasCondition && <div className={styles.ContentPrefixLabel}>log</div>}
              <div
                className={isContentValid ? styles.ContentWrapper : styles.ContentWrapperInvalid}
              >
                <BadgePicker point={point} />
                <div className={styles.Content}>
                  <div
                    className={
                      showEditBreakpointNag ? styles.ContentInputWithNag : styles.ContentInput
                    }
                  >
                    <CodeEditor
                      autoFocus={showEditBreakpointNag || editReason === "content"}
                      dataTestId={`PointPanel-ContentInput-${lineNumber}`}
                      dataTestName="PointPanel-ContentInput"
                      editable={true}
                      initialValue={editableContent}
                      onCancel={onCancel}
                      onChange={onEditableContentChange}
                      onSave={onSubmit}
                    />
                  </div>
                </div>
              </div>
            </div>
            {!hasCondition && (
              <div className={styles.FixedHeightRow}>
                <button
                  className={styles.AddConditionButton}
                  data-test-name="PointPanel-AddConditionButton"
                  disabled={isPending}
                  onClick={onAddConditionClick}
                >
                  Add conditional
                </button>
              </div>
            )}
          </div>
          <div className={styles.SecondaryColumn}>
            <div className={styles.FixedHeightRow}>
              <button
                className={styles.SaveButton}
                data-test-name="PointPanel-SaveButton"
                disabled={isPending || !isContentValid || !isConditionValid || !hasChanged}
                onClick={onSubmit}
              >
                Save
              </button>
            </div>
            <div className={styles.FixedHeightRow}>
              <button
                className={styles.CancelButton}
                data-test-name="PointPanel-CancelButton"
                disabled={isPending}
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    const hasCondition = point.condition !== null;

    let showTooManyPointsMessage = false;
    switch (hitPointStatus) {
      case "too-many-points-to-find":
      case "too-many-points-to-run-analysis":
      case "unknown-error":
        showTooManyPointsMessage = true;
        break;
    }

    const startEditing = (editReason: EditReason | null = null) => {
      trackEvent("breakpoint.start_edit");
      setEditableCondition(point.condition || null);
      setEditableContent(point.content);
      setIsEditing(true);
      setEditReason(editReason);
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

        await addCommentGraphQL(graphQLClient, accessToken, recordingId, {
          content: "",
          hasFrames: true,
          isPublished: false,
          point: currentExecutionPoint,
          sourceLocation: point.location,
          time: curentTime,
        });

        invalidateCache();
      });
    };

    return (
      <div
        className={`${styles.Panel} ${className}`}
        data-test-id={`PointPanel-${lineNumber}`}
        onMouseMove={onMouseMove}
      >
        <div className={styles.LayoutRow}>
          <div className={styles.MainColumn}>
            {hasCondition && (
              <div className={styles.FixedHeightRow}>
                <div className={styles.ContentPrefixLabel}>if</div>
                <div className={styles.ContentWrapper}>
                  <div
                    className={styles.Content}
                    onClick={showTooManyPointsMessage ? undefined : () => startEditing("condition")}
                  >
                    <SyntaxHighlightedLine code={point.condition!} />
                  </div>
                  <button
                    className={styles.EditButton}
                    disabled={isPending}
                    onClick={showTooManyPointsMessage ? undefined : () => startEditing("condition")}
                    data-test-name="PointPanel-EditButton"
                  >
                    <Icon className={styles.EditButtonIcon} type="edit" />
                  </button>
                </div>
              </div>
            )}
            <div className={styles.FixedHeightRow}>
              {hasCondition && <div className={styles.ContentPrefixLabel}>log</div>}
              {showTooManyPointsMessage ? (
                <div className={styles.ContentWrapperTooManyPoints}>
                  Use Focus Mode to reduce the number of hits.
                </div>
              ) : (
                <div className={styles.ContentWrapper}>
                  <BadgePicker point={point} />
                  <div
                    className={styles.Content}
                    onClick={showTooManyPointsMessage ? undefined : () => startEditing("content")}
                  >
                    <SyntaxHighlightedLine code={point.content} />
                  </div>
                  <button
                    className={styles.EditButton}
                    disabled={isPending}
                    onClick={showTooManyPointsMessage ? undefined : () => startEditing("content")}
                    data-test-name="PointPanel-EditButton"
                  >
                    <Icon className={styles.EditButtonIcon} type="edit" />
                  </button>
                </div>
              )}
            </div>
          </div>
          {accessToken !== null && (
            <div className={styles.SecondaryColumn}>
              <CommentButton disabled={isPending} hitPoints={hitPoints} onClick={addComment} />
            </div>
          )}
        </div>
        <div className={styles.FixedHeightRow}>
          <PointPanelTimeline hitPoints={hitPoints} hitPointStatus={hitPointStatus} point={point} />
        </div>
      </div>
    );
  }
}

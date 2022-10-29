import Icon from "@bvaughn/components/Icon";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { GraphQLClientContext } from "@bvaughn/src/contexts/GraphQLClientContext";
import { InspectorContext } from "@bvaughn/src/contexts/InspectorContext";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { addComment as addCommentGraphQL } from "@bvaughn/src/graphql/Comments";
import { getHitPointsForLocation } from "@bvaughn/src/suspense/PointsCache";
import { validate } from "@bvaughn/src/utils/points";
import {
  Suspense,
  unstable_useCacheRefresh as useCacheRefresh,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";

import Loader from "../Loader";

import AutoComplete from "./AutoComplete/AutoComplete";
import BadgePicker from "./BadgePicker";
import CommentButton from "./CommentButton";
import styles from "./PointPanel.module.css";
import PointPanelTimeline from "./PointPanelTimeline";
import SyntaxHighlightedLine from "./SyntaxHighlightedLine";

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
  const { accessToken, recordingId } = useContext(SessionContext);
  const { executionPoint: currentExecutionPoint, time: curentTime } = useContext(TimelineContext);

  const [hitPoints, hitPointStatus] = getHitPointsForLocation(
    client,
    point.location,
    null,
    focusRange
  );

  const invalidateCache = useCacheRefresh();

  const [isEditing, setIsEditing] = useState(false);

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

  if (isEditing) {
    const hasCondition = editableCondition !== null;

    const onCancel = () => {
      setEditableContent(point.content);
      setEditableCondition(point.condition);
      setIsEditing(false);
    };

    const onEditableContentChange = (newContent: string) => {
      setEditableContent(newContent);
    };

    const onEditableConditionChange = (newCondition: string) => {
      setEditableCondition(newCondition);
    };

    const onSubmit = () => {
      if (isConditionValid && isContentValid && hasChanged) {
        editPoint(point.id, { condition: editableCondition || null, content: editableContent });
      }
      setIsEditing(false);
    };

    const onAddConditionClick = () => {
      setEditableCondition("");
    };

    return (
      <div className={`${styles.Panel} ${className}`} data-test-id={`PointPanel-${lineNumber}`}>
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
                    <AutoComplete
                      autoFocus
                      className={styles.ContentInput}
                      dataTestName="PointPanel-ConditionInput"
                      onCancel={onCancel}
                      onChange={onEditableConditionChange}
                      onSubmit={onSubmit}
                      value={editableCondition}
                    />
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
                  <AutoComplete
                    autoFocus
                    className={styles.ContentInput}
                    dataTestName="PointPanel-ContentInput"
                    onCancel={onCancel}
                    onChange={onEditableContentChange}
                    onSubmit={onSubmit}
                    value={editableContent}
                  />
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
        showTooManyPointsMessage = true;
        break;
    }

    const startEditing = () => {
      setEditableCondition(point.condition || null);
      setEditableContent(point.content);
      setIsEditing(true);
    };

    const addComment = () => {
      if (accessToken === null) {
        return;
      }

      startTransition(async () => {
        if (showCommentsPanel !== null) {
          showCommentsPanel();
        }

        await addCommentGraphQL(graphQLClient, accessToken, recordingId, {
          content: "",
          hasFrames: true,
          isPublished: false,
          point: currentExecutionPoint,
          sourceLocation: location,
          time: curentTime,
        });

        invalidateCache();
      });
    };

    return (
      <div className={`${styles.Panel} ${className}`} data-test-id={`PointPanel-${lineNumber}`}>
        <div className={styles.LayoutRow}>
          <div className={styles.MainColumn}>
            {hasCondition && (
              <div className={styles.FixedHeightRow}>
                <div className={styles.ContentPrefixLabel}>if</div>
                <div className={styles.ContentWrapper}>
                  <div
                    className={styles.Content}
                    onClick={showTooManyPointsMessage ? undefined : startEditing}
                  >
                    <SyntaxHighlightedLine code={point.condition!} />
                  </div>
                  <button
                    className={styles.EditButton}
                    disabled={isPending}
                    onClick={showTooManyPointsMessage ? undefined : startEditing}
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
                    onClick={showTooManyPointsMessage ? undefined : startEditing}
                  >
                    <SyntaxHighlightedLine code={point.content} />
                  </div>
                  <button
                    className={styles.EditButton}
                    disabled={isPending}
                    onClick={showTooManyPointsMessage ? undefined : startEditing}
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

import Icon from "@bvaughn/components/Icon";
import { GraphQLClientContext } from "@bvaughn/src/contexts/GraphQLClientContext";
import { InspectorContext } from "@bvaughn/src/contexts/InspectorContext";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { addComment as addCommentGraphQL } from "@bvaughn/src/graphql/Comments";
import { validate } from "@bvaughn/src/utils/points";
import {
  Suspense,
  unstable_useCacheRefresh as useCacheRefresh,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Point } from "shared/client/types";

import Loader from "../Loader";

import AutoComplete from "./AutoComplete/AutoComplete";
import styles from "./PointPanel.module.css";
import PointPanelTimeline from "./PointPanelTimeline";
import SyntaxHighlightedLine from "./SyntaxHighlightedLine";

export default function PointPanel({ className, point }: { className: string; point: Point }) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { showCommentsPanel } = useContext(InspectorContext);
  const { editPoint } = useContext(PointsContext);
  const { accessToken, recordingId } = useContext(SessionContext);
  const { executionPoint: currentExecutionPoint, time: curentTime } = useContext(TimelineContext);

  const invalidateCache = useCacheRefresh();

  const [isEditing, setIsEditing] = useState(false);

  const [isPending, startTransition] = useTransition();

  const [editableCondition, setEditableCondition] = useState(point.condition);
  const [editableContent, setEditableContent] = useState(point.content);

  const isContentValid = useMemo(() => validate(editableContent), [editableContent]);
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
      <div className={`${styles.Point} ${className}`} data-test-id={`PointPanel-${lineNumber}`}>
        <div className={styles.MainColumn}>
          {hasCondition && (
            <div className={styles.Row}>
              <div className={styles.ContentPrefixLabel}>if</div>
              <div
                className={`${styles.ContentWrapper} ${
                  isConditionValid || styles.ContentWrapperInvalid
                }`}
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
          <div className={styles.Row}>
            {hasCondition && <div className={styles.ContentPrefixLabel}>log</div>}
            <div
              className={`${styles.ContentWrapper} ${
                isContentValid || styles.ContentWrapperInvalid
              }`}
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
            <div className={styles.Row}>
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
          <div className={styles.Row}>
            <button
              className={styles.SaveButton}
              data-test-name="PointPanel-SaveButton"
              disabled={isPending}
              onClick={onSubmit}
            >
              Save
            </button>
          </div>
          {hasCondition && (
            <div className={styles.Row}>
              <button
                className={styles.CancelButton}
                data-test-name="PointPanel-CancelButton"
                disabled={isPending}
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    const hasCondition = point.condition !== null;

    const startEditing = () => {
      setEditableCondition(point.condition || null);
      setEditableContent(point.content);
      setIsEditing(true);
    };

    const addComment = () => {
      console.log("addComment:", addComment, "accessToken?", accessToken);
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
      <div className={`${styles.Point} ${className}`} data-test-id={`PointPanel-${lineNumber}`}>
        <div className={styles.MainColumn}>
          {hasCondition && (
            <div className={styles.Row}>
              <div className={styles.ContentPrefixLabel}>if</div>
              <div className={styles.ContentWrapper}>
                <SyntaxHighlightedLine code={point.condition!} />
              </div>
            </div>
          )}
          <div className={styles.Row}>
            {hasCondition && <div className={styles.ContentPrefixLabel}>log</div>}
            <div className={styles.ContentWrapper}>
              <BadgePicker point={point} />
              <div className={styles.Content} onClick={startEditing}>
                <SyntaxHighlightedLine code={point.content} />
              </div>
              <button
                className={styles.EditButton}
                disabled={isPending}
                onClick={startEditing}
                data-test-name="PointPanel-EditButton"
              >
                <Icon className={styles.EditButtonIcon} type="edit" />
              </button>
            </div>
          </div>
          <div className={styles.Row}>
            <Suspense fallback={<Loader />}>
              <PointPanelTimeline point={point} />
            </Suspense>
          </div>
        </div>
        {accessToken !== null && (
          <div className={styles.SecondaryColumn}>
            <button
              className={styles.CommentButton}
              disabled={isPending}
              data-test-name="PointPanel-AddCommentButton"
              onClick={addComment}
            >
              <Icon className={styles.CommentButtonIcon} type="comment" />
            </button>
          </div>
        )}
      </div>
    );
  }
}

// TODO Badge picker UI
function BadgePicker({ point }: { point: Point }) {
  return <div className={styles.BadgePicker} />;
}

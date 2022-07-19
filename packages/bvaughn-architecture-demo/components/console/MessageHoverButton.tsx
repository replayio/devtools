import Icon from "@bvaughn/components/Icon";
import { GraphQLClientContext } from "@bvaughn/src/contexts/GraphQLClientContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import { addComment as addCommentGraphQL } from "@bvaughn/src/graphql/Comments";
import { ExecutionPoint } from "@replayio/protocol";
import {
  RefObject,
  unstable_useCacheRefresh as useCacheRefresh,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";

import styles from "./MessageHoverButton.module.css";

export default function MessageHoverButton({
  executionPoint,
  showAddCommentButton,
  targetRef,
  time,
}: {
  executionPoint: ExecutionPoint;
  showAddCommentButton: boolean;
  targetRef: RefObject<HTMLDivElement | null>;
  time: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { accessToken, recordingId } = useContext(SessionContext);
  const graphQLClient = useContext(GraphQLClientContext);
  const {
    executionPoint: currentExecutionPoint,
    time: currentTime,
    update,
  } = useContext(TimelineContext);

  const invalidateCache = useCacheRefresh();
  const [isPending, startTransition] = useTransition();

  const isCurrentlyPausedAt = currentExecutionPoint === executionPoint;

  useLayoutEffect(() => {
    const button = ref.current;
    const target = targetRef.current;
    if (button && target) {
      const buttonRect = button.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      button.style.left = `${targetRect.left - buttonRect.width / 2}px`;
      button.style.top = `${targetRect.top}px`;
    }
  }, [targetRef]);

  let button = null;
  if (isCurrentlyPausedAt) {
    if (showAddCommentButton && accessToken) {
      const addCommentTransition = () => {
        startTransition(async () => {
          await addCommentGraphQL(graphQLClient, accessToken, recordingId, {
            content: "",
            hasFrames: true,
            isPublished: false,
            point: executionPoint,
            time,
          });

          invalidateCache();
        });
      };

      button = (
        <button
          className={styles.AddCommentButton}
          data-test-id="AddCommentButton"
          disabled={isPending}
          onClick={addCommentTransition}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          ref={ref}
        >
          <Icon className={styles.AddCommentButtonIcon} type="comment" />
          {isHovered && <span className={styles.Label}>Add comment</span>}
        </button>
      );
    }
  } else {
    button = (
      <button
        className={styles.FastForwardButton}
        data-test-id="FastForwardButton"
        onClick={() => update(time, executionPoint)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={ref}
      >
        <Icon
          className={styles.FastForwardButtonIcon}
          type={
            currentExecutionPoint === null || executionPoint > currentExecutionPoint
              ? "fast-forward"
              : "rewind"
          }
        />
        {isHovered && (
          <span className={styles.Label}>
            {currentExecutionPoint === null || executionPoint > currentExecutionPoint
              ? "Fast-forward"
              : "Rewind"}
          </span>
        )}
      </button>
    );
  }

  return button !== null ? createPortal(button, document.body) : null;
}

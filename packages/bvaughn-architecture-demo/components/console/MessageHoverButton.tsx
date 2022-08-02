import Icon from "@bvaughn/components/Icon";
import { GraphQLClientContext } from "@bvaughn/src/contexts/GraphQLClientContext";
import { InspectorContext } from "@bvaughn/src/contexts/InspectorContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import { addComment as addCommentGraphQL } from "@bvaughn/src/graphql/Comments";
import { ExecutionPoint, Location, PauseId } from "@replayio/protocol";
import {
  MouseEvent,
  RefObject,
  unstable_useCacheRefresh as useCacheRefresh,
  useContext,
  useRef,
  useState,
  useTransition,
} from "react";

import styles from "./MessageHoverButton.module.css";

export default function MessageHoverButton({
  executionPoint,
  location,
  pauseId,
  showAddCommentButton,
  targetRef,
  time,
}: {
  executionPoint: ExecutionPoint;
  location: Location | null;
  pauseId: PauseId;
  showAddCommentButton: boolean;
  targetRef: RefObject<HTMLDivElement | null>;
  time: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { inspectFunctionDefinition } = useContext(InspectorContext);
  const { accessToken, recordingId } = useContext(SessionContext);
  const graphQLClient = useContext(GraphQLClientContext);
  const { executionPoint: currentExecutionPoint, update } = useContext(TimelineContext);

  const invalidateCache = useCacheRefresh();
  const [isPending, startTransition] = useTransition();

  const isCurrentlyPausedAt = currentExecutionPoint === executionPoint;

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
    const onClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      update(time, executionPoint, pauseId);

      if (inspectFunctionDefinition !== null && location !== null) {
        inspectFunctionDefinition([location]);
      }
    };

    button = (
      <button
        className={styles.ConsoleMessageHoverButton}
        data-test-id="ConsoleMessageHoverButton"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={ref}
      >
        <Icon
          className={styles.ConsoleMessageHoverButtonIcon}
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

  return button;
}

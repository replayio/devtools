import Icon from "bvaughn-architecture-demo/components/Icon";
import { GraphQLClientContext } from "bvaughn-architecture-demo/src/contexts/GraphQLClientContext";
import { InspectorContext } from "bvaughn-architecture-demo/src/contexts/InspectorContext";
import { TimelineContext } from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import { SessionContext } from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { addComment as addCommentGraphQL } from "bvaughn-architecture-demo/src/graphql/Comments";
import { ExecutionPoint, Location } from "@replayio/protocol";
import {
  MouseEvent,
  unstable_useCacheRefresh as useCacheRefresh,
  useContext,
  useRef,
  useState,
  useTransition,
} from "react";

import styles from "./MessageHoverButton.module.css";
import { useDismissNag } from "bvaughn-architecture-demo/src/hooks/useDismissNag";
import { isExecutionPointsGreaterThan } from "bvaughn-architecture-demo/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Nag } from "bvaughn-architecture-demo/src/graphql/types";

export default function MessageHoverButton({
  executionPoint,
  locations,
  showAddCommentButton,
  time,
}: {
  executionPoint: ExecutionPoint;
  locations: Location[] | null;
  showAddCommentButton: boolean;
  time: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const dismissNag = useDismissNag();
  const [isHovered, setIsHovered] = useState(false);

  const { inspectFunctionDefinition, showCommentsPanel } = useContext(InspectorContext);
  const { accessToken, recordingId } = useContext(SessionContext);
  const graphQLClient = useContext(GraphQLClientContext);
  const { executionPoint: currentExecutionPoint, update } = useContext(TimelineContext);

  const invalidateCache = useCacheRefresh();
  const [isPending, startTransition] = useTransition();

  const isCurrentlyPausedAt = currentExecutionPoint === executionPoint;

  const client = useContext(ReplayClientContext);
  const location = locations ? client.getPreferredLocation(locations) : null;

  let button = null;
  if (isCurrentlyPausedAt) {
    if (showAddCommentButton && accessToken) {
      const addCommentTransition = () => {
        startTransition(async () => {
          if (showCommentsPanel !== null) {
            showCommentsPanel();
          }
          await addCommentGraphQL(graphQLClient, accessToken, recordingId, {
            content: "",
            hasFrames: true,
            isPublished: false,
            point: executionPoint,
            sourceLocation: location,
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
          <span className={isHovered ? styles.LabelHovered : styles.Label}> Add comment </span>
        </button>
      );
    }
  } else {
    const onClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      update(time, executionPoint);

      if (inspectFunctionDefinition !== null && location !== null) {
        inspectFunctionDefinition([location]);
      }

      dismissNag(Nag.FIRST_CONSOLE_NAVIGATE);
    };

    const label =
      currentExecutionPoint === null ||
      isExecutionPointsGreaterThan(executionPoint, currentExecutionPoint)
        ? "Fast-forward"
        : "Rewind";

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
            currentExecutionPoint === null ||
            isExecutionPointsGreaterThan(executionPoint, currentExecutionPoint)
              ? "fast-forward"
              : "rewind"
          }
        />
        <span className={isHovered ? styles.LabelHovered : styles.Label}> {label} </span>
      </button>
    );
  }

  return button;
}

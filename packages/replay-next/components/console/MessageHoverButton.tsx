import { ExecutionPoint, Location } from "@replayio/protocol";
import {
  MouseEvent,
  unstable_useCacheRefresh as useCacheRefresh,
  useContext,
  useRef,
  useState,
  useTransition,
} from "react";

import Icon from "replay-next/components/Icon";
import {
  COMMENT_TYPE_SOURCE_CODE,
  createTypeDataForSourceCodeComment,
} from "replay-next/components/sources/utils/comments";
import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { LayoutContext } from "replay-next/src/contexts/LayoutContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { getPreferredLocationWorkaround } from "replay-next/src/utils/sources";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { addComment as addCommentGraphQL } from "shared/graphql/Comments";
import { Nag } from "shared/graphql/types";
import { compareTimeStampedPoints } from "protocol/utils";

import styles from "./MessageHoverButton.module.css";

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
  const [, dismissFirstConsoleNavigateNag] = useNag(Nag.FIRST_CONSOLE_NAVIGATE);

  const [isHovered, setIsHovered] = useState(false);

  const { inspectFunctionDefinition, showCommentsPanel } = useContext(InspectorContext);
  const { accessToken, recordingId, trackEvent } = useContext(SessionContext);
  const graphQLClient = useContext(GraphQLClientContext);
  const { executionPoint: currentExecutionPoint, time: currentTime, update } = useContext(TimelineContext);
  const { canShowConsoleAndSources } = useContext(LayoutContext);

  const invalidateCache = useCacheRefresh();
  const [isPending, startTransition] = useTransition();

  const isCurrentlyPausedAt = currentExecutionPoint === executionPoint;

  const client = useContext(ReplayClientContext);
  const { preferredGeneratedSourceIds } = useContext(SourcesContext);

  const sourcesById = sourcesByIdCache.getValueIfCached(client);
  const location =
    locations && sourcesById
      ? getPreferredLocationWorkaround(sourcesById, preferredGeneratedSourceIds, locations)
      : null;

  let button = null;
  if (isCurrentlyPausedAt) {
    if (showAddCommentButton && accessToken && location !== null) {
      const onClick = () => {
        if (location === null) {
          return;
        }

        trackEvent("console.add_comment");

        startTransition(async () => {
          if (showCommentsPanel !== null) {
            showCommentsPanel();
          }

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
            point: executionPoint,
            time,
            type: COMMENT_TYPE_SOURCE_CODE,
            typeData,
          });

          invalidateCache();
        });
      };

      button = (
        <button
          className={styles.AddCommentButton}
          data-test-id="AddCommentButton"
          disabled={isPending}
          onClick={onClick}
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

      trackEvent("console.seek");
      trackEvent("console.select_source");

      // we only want to open the source if this doesn't hide the console
      update(time, executionPoint, canShowConsoleAndSources, location ?? undefined);

      if (canShowConsoleAndSources && inspectFunctionDefinition !== null && location !== null) {
        inspectFunctionDefinition([location]);
      }

      dismissFirstConsoleNavigateNag();
    };

    const pointTS = { point: executionPoint, time };

    const label =
      currentExecutionPoint === null ||
      compareTimeStampedPoints(pointTS, { point: currentExecutionPoint, time: currentTime }) > 0
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
            compareTimeStampedPoints(pointTS, { point: currentExecutionPoint, time: currentTime }) > 0
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

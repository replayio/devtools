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
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { addComment as addCommentGraphQL } from "shared/graphql/Comments";
import { Nag } from "shared/graphql/types";

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
  const [consoleNavigateState, dismissFirstConsoleNavigateNag] = useNag(Nag.FIRST_CONSOLE_NAVIGATE);
  const [breakpointEditState, dismissFirstBreakpointEditNag] = useNag(Nag.FIRST_BREAKPOINT_EDIT);

  const [addCommentToLineState, dismissAddCommentToLineNag] = useNag(Nag.ADD_COMMENT_TO_LINE);
  const [addCommentToNetworkRequestState, dismissAddCommentToNetworkRequestNag] = useNag(
    Nag.ADD_COMMENT_TO_NETWORK_REQUEST
  );
  const [addCommentToPrintStatementState, dismissAddCommentToPrintStatementNag] = useNag(
    Nag.ADD_COMMENT_TO_PRINT_STATEMENT
  );

  const [addUnicornBadgeState, dismissAddUnicornBadgeNag] = useNag(Nag.ADD_UNICORN_BADGE);
  const [recordReplayState, dismissRecordReplayNag] = useNag(Nag.RECORD_REPLAY);
  const [exploreSourcesState, dismissExploreSourcesNag] = useNag(Nag.EXPLORE_SOURCES);
  const [searchSourceTextState, dismissSearchSourceTextNag] = useNag(Nag.SEARCH_SOURCE_TEXT);
  const [quickOpenFileState, dismissQuickOpenFileNag] = useNag(Nag.QUICK_OPEN_FILE);
  const [launchCommandPaletteState, dismissLaunchCommandPaletteNag] = useNag(
    Nag.LAUNCH_COMMAND_PALETTE
  );
  const [jumpToEventState, dismissJumpToEventNag] = useNag(Nag.JUMP_TO_EVENT);
  const [inspectElementState, dismissInspectElementNag] = useNag(Nag.INSPECT_ELEMENT);
  const [inspectComponentState, dismissInspectComponentNag] = useNag(Nag.INSPECT_COMPONENT);
  const [useFocusModeState, dismissUseFocusModeNag] = useNag(Nag.USE_FOCUS_MODE);

  const [isHovered, setIsHovered] = useState(false);

  const { inspectFunctionDefinition, showCommentsPanel } = useContext(InspectorContext);
  const { accessToken, recordingId } = useContext(SessionContext);
  const graphQLClient = useContext(GraphQLClientContext);
  const { executionPoint: currentExecutionPoint, update } = useContext(TimelineContext);
  const { canShowConsoleAndSources } = useContext(LayoutContext);

  const invalidateCache = useCacheRefresh();
  const [isPending, startTransition] = useTransition();

  const isCurrentlyPausedAt = currentExecutionPoint === executionPoint;

  const client = useContext(ReplayClientContext);
  const location = locations ? client.getPreferredLocation(locations) : null;

  let button = null;
  if (isCurrentlyPausedAt) {
    if (showAddCommentButton && accessToken && location !== null) {
      const addCommentTransition = () => {
        if (location === null) {
          return;
        }

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

      // we only want to open the source if this doesn't hide the console
      update(time, executionPoint, canShowConsoleAndSources);

      if (canShowConsoleAndSources && inspectFunctionDefinition !== null && location !== null) {
        inspectFunctionDefinition([location]);
      }

      dismissFirstConsoleNavigateNag();
      dismissFirstBreakpointEditNag();

      dismissAddCommentToLineNag();
      dismissAddCommentToNetworkRequestNag();
      dismissAddCommentToPrintStatementNag();

      dismissAddUnicornBadgeNag();
      dismissRecordReplayNag();
      dismissExploreSourcesNag();
      dismissSearchSourceTextNag();
      dismissQuickOpenFileNag();
      dismissLaunchCommandPaletteNag();
      dismissJumpToEventNag();
      dismissInspectElementNag();
      dismissInspectComponentNag();
      dismissUseFocusModeNag();
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

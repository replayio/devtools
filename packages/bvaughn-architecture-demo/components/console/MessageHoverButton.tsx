import Icon from "@bvaughn/components/Icon";
import { GraphQLClientContext } from "@bvaughn/src/contexts/GraphQLClientContext";
import { PauseContext } from "@bvaughn/src/contexts/PauseContext";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import { addComment as addCommentGraphQL } from "@bvaughn/src/graphql/Comments";
import { Message, PauseId } from "@replayio/protocol";
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
  message,
  messageRendererRef,
  pauseId,
}: {
  message: Message;
  messageRendererRef: RefObject<HTMLDivElement | null>;
  pauseId: PauseId | null;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { accessToken, recordingId } = useContext(SessionContext);
  const graphQLClient = useContext(GraphQLClientContext);
  const { pauseId: currentPauseId, update } = useContext(PauseContext);

  const invalidateCache = useCacheRefresh();
  const [isPending, startTransition] = useTransition();

  const isCurrentlyPausedAt = currentPauseId === pauseId;

  useLayoutEffect(() => {
    const button = ref.current;
    const target = messageRendererRef.current;
    if (button && target) {
      const buttonRect = button.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      button.style.left = `${targetRect.left - buttonRect.width / 2}px`;
      button.style.top = `${targetRect.top}px`;
    }
  }, [messageRendererRef]);

  let button = null;
  if (pauseId !== null) {
    if (isCurrentlyPausedAt) {
      if (accessToken) {
        const addCommentTransition = () => {
          startTransition(async () => {
            await addCommentGraphQL(graphQLClient, accessToken, recordingId, {
              content: "",
              hasFrames: true,
              isPublished: false,
              point: message.point.point,
              time: message.point.time,
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
          onClick={() => update(pauseId)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          ref={ref}
        >
          <Icon className={styles.FastForwardButtonIcon} type="fast-forward" />
          {isHovered && <span className={styles.Label}>Fast-forward</span>}
        </button>
      );
    }
  }

  return button !== null ? createPortal(button, document.body) : null;
}

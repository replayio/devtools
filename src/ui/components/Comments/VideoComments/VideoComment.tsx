import { ChatAltIcon } from "@heroicons/react/solid";
import { useLayoutEffect, useRef } from "react";

import { isVisualCommentTypeData } from "replay-next/components/sources/utils/comments";
import { setHoveredCommentId, setSelectedCommentId } from "ui/actions/app";
import { subscribe } from "ui/components/Video/MutableGraphicsState";
import { useAppDispatch } from "ui/setup/hooks";
import { Comment } from "ui/state/comments";

import styles from "./VideoComment.module.css";

export default function VideoComment({
  comment,
  isHighlighted,
}: {
  comment: Comment;
  isHighlighted: boolean;
}) {
  const dispatch = useAppDispatch();

  const elementRef = useRef<HTMLDivElement>(null);

  const { type, typeData } = comment;

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element) {
      // Imperatively position and scale these graphics to avoid "render lag" when resizes occur
      return subscribe(state => {
        const { height, width } = state;
        const { scaledX, scaledY } = typeData;

        element.style.left = `${scaledX * width}px`;
        element.style.top = `${scaledY * height}px`;
      });
    }
  }, [type, typeData]);

  if (!isVisualCommentTypeData(type, typeData)) {
    return null;
  }

  const { scaledX, scaledY } = typeData;
  if (scaledX === null || scaledY === null) {
    return null;
  }

  return (
    <div
      className={styles.Marker}
      data-active={isHighlighted || undefined}
      onClick={() => {
        dispatch(setSelectedCommentId(comment.id));
      }}
      onMouseEnter={() => {
        dispatch(setHoveredCommentId(comment.id));
      }}
      onMouseLeave={() => {
        dispatch(setHoveredCommentId(null));
      }}
      ref={elementRef}
    >
      <ChatAltIcon className={styles.Icon} />
    </div>
  );
}

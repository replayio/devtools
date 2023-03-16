import classNames from "classnames";
import { toInteger } from "lodash";
import { MouseEvent, useState } from "react";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import { isSourceCodeCommentTypeData } from "replay-next/components/sources/utils/comments";
import { seekToComment } from "ui/actions/comments";
import { setViewMode } from "ui/actions/layout";
import { getViewMode } from "ui/reducers/layout";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Comment } from "ui/state/comments";
import { isCommentContentEmpty } from "ui/utils/comments";
import { trackEvent } from "ui/utils/telemetry";

import CommentPreview from "./CommentPreview";
import CommentReplyButton from "./CommentReplyButton";
import EditableRemark from "./EditableRemark";
import ReplyCard from "./ReplyCard";
import SourceCodePreview from "./TranscriptComments/SourceCodePreview";
import styles from "./CommentCard.module.css";

export default function CommentCard({ comment }: { comment: Comment }) {
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const viewMode = useAppSelector(getViewMode);
  const isPaused = currentTime === comment.time && executionPoint === comment.point;

  const context = useAppSelector(getThreadContext);
  const dispatch = useAppDispatch();

  const onClick = (event: MouseEvent) => {
    event.stopPropagation();
    const openSource = viewMode === "dev";
    dispatch(seekToComment(comment, comment.sourceLocation, openSource));

    const { type, typeData } = comment;
    if (openSource && isSourceCodeCommentTypeData(type, typeData)) {
      dispatch(setViewMode("dev"));
      trackEvent("comments.select_location");

      dispatch(
        selectLocation(context, {
          column: typeData.columnIndex,
          line: typeData.lineNumber,
          sourceId: typeData.sourceId,
          sourceUrl: typeData.sourceUrl || undefined,
        })
      );
    }
  };

  const onPreviewClick = (event: MouseEvent) => {
    event.stopPropagation();
    dispatch(seekToComment(comment, comment.sourceLocation, true));
  };

  const showReplyButton = !isCommentContentEmpty(comment.content);

  const [styleComment, setStyleComment] = useState(["Info", "info"]);

  function handlerStyle(event) {
    console.log(event.target.parentElement.lastChild);
    event.target.parentElement.lastChild?.classList?.remove("hidden");
  }
  function styleHandlerBlur(event) {
    event.target.parentElement?.lastChild?.classList?.add("hidden");
  }
  function changeStyle(event) {
    const style = event.target.dataset.style;
    event.target.parentElement.classList.add("hidden");
    event.target.parentElement.parentElement.firstChild.classList = styleTagStyle + commentStyle[style][2]
    setStyleComment([commentStyle[toInteger(style)][0], commentStyle[toInteger(style)][1]]);
  }
  const styleTagStyle = 'flex w-full items-center justify-between py-1 px-3 font-medium border'
  const commentStyle = [
    ["Bug", "bug_report", " bg-green-100 text-green-600 border-green-600"],
    ["Breadscrumb", "hdr_strong", " bg-yellow-100 text-yellow-600 border-yellow-600"],
    ["Question", "question_mark", " bg-red-100 text-red-600 border-red-600"],
    ["Info", "sms", " bg-gray-50 text-zinc-500 border-gray-400"],
  ];

  return (
    <div
      className={classNames(styles.CommentCard, !comment.isPublished && styles.Unpublished)}
      onClick={onClick}
    >
      <div className="relative mx-3 my-1 flex justify-center rounded-md bg-gray-50 text-zinc-600">
        <button
        type="button"
          onClick={handlerStyle}
          className={styleTagStyle  + commentStyle[3][2]}
        >
          <span>{styleComment[0]}</span>
          <span className="material-icons-outlined text-lg">{styleComment[1]}</span>
        </button>
        <ul className=" absolute top-0  z-10 mx-3 flex hidden w-full flex-col justify-center overflow-hidden rounded-md bg-white shadow-xl">
          <li
            className="w-full py-2  text-center hover:bg-gray-100"
            data-style="0"
            onClick={changeStyle}
          >
            Bug
          </li>
          <li
            className="w-full py-2  text-center hover:bg-gray-100"
            data-style="1"
            onClick={changeStyle}
          >
            Breadscrumb
          </li>
          <li
            className="w-full py-2  text-center hover:bg-gray-100"
            data-style="3"
            onClick={changeStyle}
          >
            Info
          </li>
          <li
            className="w-full py-2  text-center hover:bg-gray-100"
            data-style="2"
            onClick={changeStyle}
          >
            Question
          </li>
        </ul>
      </div>
      {isPaused && <div className={styles.PausedOverlay} />}


      <EditableRemark remark={comment} type="comment" />

      {comment.replies.map(reply => (
        <ReplyCard key={reply.id} reply={reply} />
      ))}

      <CommentPreview comment={comment} onClick={onPreviewClick} />

      {showReplyButton && <CommentReplyButton comment={comment} />}
    </div>
  );
}

import { Editor, JSONContent } from "@tiptap/react";
import classNames from "classnames";
import { useState } from "react";
import useAddComment from "ui/hooks/comments/useAddComment";
import { Comment } from "ui/state/comments";
import CommentEditor from "./CommentEditor";

enum CommentStatus {
  IDLE,
  PERSISTING,
  ERROR,
}

const NewCommentCard = ({ comment }: { comment: Comment }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(CommentStatus.IDLE);
  const createComment = useAddComment();

  console.log({ comment, status });

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className={classNames({
        "opacity-50": status === CommentStatus.PERSISTING,
        "bg-red-100": status === CommentStatus.ERROR,
      })}
    >
      <div className="m-4">{comment.user.name}</div>
      <div className="m-4">
        <CommentEditor
          comment={comment}
          editable={isEditing}
          handleSubmit={async (inputValue: string) => {
            console.log("submitted", inputValue);
            console.log({ inputValue });
            try {
              setStatus(CommentStatus.PERSISTING);
              const result = await createComment({
                ...comment,
                content: inputValue,
              });
              setStatus(CommentStatus.IDLE);
              // dispatch("COMMENT_PERSISTED", { id: id });
              console.log({ result });
            } catch (e) {
              setStatus(CommentStatus.ERROR);
              setTimeout(() => {
                setStatus(CommentStatus.IDLE);
              }, 4000);
              console.log(e);
              alert("There was a problem saving your comment");
            }
          }}
          onCreate={async (editor: { editor: Pick<Editor, "commands"> }) => {
            console.log("created", editor);
          }}
          onUpdate={function (editor: { editor: Pick<Editor, "getJSON"> }): void {
            console.log("updated", editor.editor.getJSON);
          }}
          handleCancel={() => {
            console.log("canceled");
            setIsEditing(false);
            console.log("noLongerEditing");
          }}
        />
      </div>
    </div>
  );
};

export default NewCommentCard;

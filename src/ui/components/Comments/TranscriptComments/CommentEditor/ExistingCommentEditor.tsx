import React from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import CommentEditor from "./CommentEditor";
import { useGetUserId } from "ui/hooks/users";
import { CommentData } from "../types";

const LoomComment = connect(null, { setModal: actions.setModal })(
  ({ setModal, loom }: { loom: string; setModal: typeof actions.setModal }) => {
    function showLoom() {
      setModal("loom", { loom });
    }

    return (
      <div onClick={showLoom}>
        <img src={`https://cdn.loom.com/sessions/thumbnails/${loom}-with-play.jpg`} />
      </div>
    );
  }
);

type ExistingCommentEditorProps = {
  data: CommentData;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  onSubmit: (data: CommentData, inputValue: string) => void;
};

function ExistingCommentEditor({
  isEditing,
  setIsEditing,
  data,
  onSubmit,
}: ExistingCommentEditorProps) {
  const { comment } = data;
  const { userId } = useGetUserId();

  const loom = comment.content.match(/loom\.com\/share\/(\S*?)(\"|\?)/)?.[1];
  if (loom) {
    return <LoomComment loom={loom} />;
  }

  return (
    <div
      onDoubleClick={() => {
        if (comment.user.id === userId) {
          setIsEditing(true);
        }
      }}
    >
      <CommentEditor
        editable={isEditing}
        comment={comment}
        handleSubmit={inputValue => {
          setIsEditing(false);
          onSubmit(data, inputValue);
        }}
        handleCancel={() => setIsEditing(false)}
      />
    </div>
  );
}

export default ExistingCommentEditor;

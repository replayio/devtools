import React, { useState, useRef, useEffect } from "react";
import { ThreadFront } from "protocol/thread";
import { useAuth0 } from "@auth0/auth0-react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import CommentTool from "ui/components/shared/CommentTool";
import "draft-js/dist/Draft.css";

function DraftJSEditor({ editorState, setEditorState, DraftJS, setDraftJS }) {
  useEffect(function importDraftJS() {
    import("draft-js").then(DraftJS => {
      setEditorState(DraftJS.EditorState.createEmpty());
      setDraftJS(DraftJS);
    });
  }, []);

  if (!DraftJS) {
    return null;
  }

  const { Editor, getDefaultKeyBinding } = DraftJS;

  return (
    <Editor
      editorState={editorState}
      onChange={setEditorState}
      handleKeyCommand={e => getDefaultKeyBinding(e)}
      placeholder={"Type a comment ..."}
    />
  );
}

function CommentEditor({
  comment,
  clearPendingComment,
  pendingComment,
  recordingId,
  canvas,
  currentTime,
}) {
  const { user } = useAuth0();
  const [editorState, setEditorState] = useState(null);
  const [DraftJS, setDraftJS] = useState();
  const addComment = hooks.useAddComment(clearPendingComment);

  const isNewComment = comment.content === "";

  const handleSave = () => {
    if (isNewComment) {
      handleNewSave();
    } else {
      handleReplySave();
    }
  };
  const handleReplySave = () => {
    const inputValue = editorState.getCurrentContent().getPlainText();

    // For now we can simply bail if the input happens to be empty. We should fix
    // this in the next pass to handle and show an error prompt.
    if (inputValue == "") {
      return;
    }

    const reply = {
      content: inputValue,
      recording_id: recordingId,
      time: currentTime,
      point: ThreadFront.currentPoint,
      has_frames: ThreadFront.currentPointHasFrames,
      parent_id: comment.id,
      position: {
        x: canvas.width * 0.5,
        y: canvas.height * 0.5,
      },
    };

    addComment({
      variables: { object: reply },
    });
    setEditorState(DraftJS.EditorState.createEmpty());
  };
  const handleNewSave = () => {
    const inputValue = editorState.getCurrentContent().getPlainText();

    // For now we can simply bail if the input happens to be empty. We should fix
    // this in the next pass to handle and show an error prompt.
    if (inputValue == "") {
      return;
    }

    const newComment = {
      ...comment,
      content: inputValue,
      position: {
        x: pendingComment.position.x,
        y: pendingComment.position.y,
      },
    };
    addComment({
      variables: { object: newComment },
    });
  };

  return (
    <div className="comment-input-container">
      <img src={user.picture} className="comment-picture" />
      <div className="comment-input">
        <DraftJSEditor {...{ editorState, setEditorState, DraftJS, setDraftJS }} />
      </div>
      <button className="img paper-airplane" onClick={handleSave} />
      {isNewComment && <CommentTool comment={comment} />}
    </div>
  );
}

export default connect(
  state => ({
    recordingId: selectors.getRecordingId(state),
    currentTime: selectors.getCurrentTime(state),
    pendingComment: selectors.getPendingComment(state),
    canvas: selectors.getCanvas(state),
  }),
  {
    clearPendingComment: actions.clearPendingComment,
  }
)(CommentEditor);

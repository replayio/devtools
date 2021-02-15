import React, { useState, useRef, useEffect } from "react";
import { ThreadFront } from "protocol/thread";
import { useAuth0 } from "@auth0/auth0-react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import CommentTool from "ui/components/shared/CommentTool";
import "draft-js/dist/Draft.css";

function DraftJSEditorLoader({
  editorState,
  setEditorState,
  DraftJS,
  setDraftJS,
  handleSave,
  handleCancel,
}) {
  useEffect(function importDraftJS() {
    import("draft-js").then(DraftJS => {
      setEditorState(DraftJS.EditorState.createEmpty());
      setDraftJS(DraftJS);
    });
  }, []);

  if (!DraftJS) {
    return null;
  }

  return <DraftJSEditor {...{ editorState, setEditorState, DraftJS, handleSave, handleCancel }} />;
}

function DraftJSEditor({ editorState, setEditorState, DraftJS, handleSave, handleCancel }) {
  const editorNode = useRef(null);
  const wrapperNode = useRef(null);
  const { Editor, getDefaultKeyBinding, KeyBindingUtil } = DraftJS;

  useEffect(() => {
    // The order is important here — we focus the editor first before scrolling the
    // wrapper into view. Otherwise, the scrolling animation is interrupted by the focus.
    editorNode.current.focus();
    wrapperNode.current.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  const keyBindingFn = e => {
    if (e.keyCode == 13 && e.metaKey && KeyBindingUtil.hasCommandModifier(e)) {
      return "save";
    }
    if (e.keyCode == 27) {
      return "cancel";
    }

    return getDefaultKeyBinding(e);
  };
  const handleKeyCommand = command => {
    if (command === "save") {
      handleSave();
      return "handled";
    } else if (command === "cancel") {
      handleCancel();
      return "handled";
    }

    return "not-handled";
  };

  return (
    <div className="draft-editor-container" ref={wrapperNode}>
      <Editor
        editorState={editorState}
        onChange={setEditorState}
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={keyBindingFn}
        placeholder={"Type a comment ..."}
        ref={editorNode}
      />
    </div>
  );
}

function CommentEditor({
  comment,
  clearPendingComment,
  setActiveComment,
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
  const handleCancel = () => {
    clearPendingComment();
    setActiveComment(null);
  };
  const handleReplySave = async () => {
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
      source_location: await ThreadFront.getCurrentPauseSourceLocation(),
      position: {
        x: canvas.width * 0.5,
        y: canvas.height * 0.5,
      },
    };

    addComment({ variables: { object: reply } });
    setEditorState(DraftJS.EditorState.createEmpty());
  };
  const handleNewSave = async () => {
    const inputValue = editorState.getCurrentContent().getPlainText();

    // For now we can simply bail if the input happens to be empty. We should fix
    // this in the next pass to handle and show an error prompt.
    if (inputValue == "") {
      return;
    }

    const newComment = {
      ...comment,
      content: inputValue,
      source_location: await ThreadFront.getCurrentPauseSourceLocation(),
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
        <DraftJSEditorLoader
          {...{ editorState, setEditorState, DraftJS, setDraftJS, handleSave, handleCancel }}
        />
        <div className="comment-input-actions">
          <button className="action-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button className="action-submit" onClick={handleSave}>
            Submit
          </button>
        </div>
      </div>
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
    setActiveComment: actions.setActiveComment,
  }
)(CommentEditor);

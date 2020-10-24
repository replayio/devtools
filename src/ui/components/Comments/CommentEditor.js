import React from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { getAvatarColor } from "ui/utils/user";
import classnames from "classnames";

class CommentEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inputValue: props.comment.contents,
    };
  }

  componentDidMount() {
    const { inputValue } = this.state;
    const textarea = this._textarea;

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  onChange = e => {
    this.setState({ inputValue: e.target.value });
  };

  onKeyDown = e => {
    if (e.key == "Escape") {
      this.stopEditingComment(e);
    } else if (e.key == "Enter" && (e.metaKey || e.ctrlKey)) {
      this.saveEditedComment(e);
    }
  };

  saveEditedComment = e => {
    const { comment, stopEditing, location, saveComment } = this.props;
    const { inputValue } = this.state;
    e.stopPropagation();
    stopEditing();

    saveComment(inputValue, location, comment);
  };

  stopEditingComment = e => {
    const { comment, stopEditing, unfocusComment } = this.props;
    const { inputValue } = this.state;
    e.stopPropagation();
    stopEditing();
    this.setState({ inputValue: comment.contents });

    unfocusComment(comment);
  };

  renderButtons() {
    return (
      <div className="buttons">
        <button className="cancel" onClick={this.stopEditingComment}>
          Cancel
        </button>
        <button className="save" onClick={this.saveEditedComment}>
          Save
        </button>
      </div>
    );
  }

  render() {
    const { comment } = this.props;

    return (
      <div className="editor">
        <textarea
          defaultValue={comment.contents}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          ref={c => (this._textarea = c)}
        />
        {this.renderButtons()}
      </div>
    );
  }
}

export default connect(() => ({}), {
  unfocusComment: actions.unfocusComment,
  saveComment: actions.saveComment,
})(CommentEditor);

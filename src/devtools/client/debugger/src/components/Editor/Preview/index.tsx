/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";

import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { UIState } from "ui/state";

import Popup from "./Popup";

import { getPreview, getThreadContext } from "../../../selectors";
import actions from "../../../actions";
import { PreviewHighlight } from "./PreviewHighlight";
import { SourceLocation } from "@replayio/protocol";

const mapStateToProps = (state: UIState) => {
  return {
    cx: getThreadContext(state),
    preview: getPreview(state),
  };
};

const connector = connect(mapStateToProps, {
  clearPreview: actions.clearPreview,
  updatePreview: actions.updatePreview,
});

type PropsFromRedux = ConnectedProps<typeof connector>;
type PreviewProps = PropsFromRedux & {
  editor: any;
  editorRef: any;
};

type PreviewState = { selecting: boolean };

class Preview extends PureComponent<PreviewProps, PreviewState> {

  state = { selecting: false };

  componentDidMount() {
    this.updateListeners();
  }

  componentWillUnmount() {
    const { codeMirror } = this.props.editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();

    codeMirror.off("tokenenter", this.onTokenEnter);
    codeMirror.off("scroll", this.onScroll);
    codeMirrorWrapper.removeEventListener("mouseup", this.onMouseUp);
    codeMirrorWrapper.removeEventListener("mousedown", this.onMouseDown);
  }

  updateListeners() {
    const { codeMirror } = this.props.editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();
    codeMirror.on("tokenenter", this.onTokenEnter);
    codeMirror.on("tokenleave", this.onTokenLeave);
    codeMirror.on("scroll", this.onScroll);
    codeMirrorWrapper.addEventListener("mouseup", this.onMouseUp);
    codeMirrorWrapper.addEventListener("mousedown", this.onMouseDown);
  }

  onTokenEnter = ({ target, tokenPos }: { target: HTMLElement; tokenPos: SourceLocation }) => {
    const { cx, editor, updatePreview } = this.props;

    if (cx.isPaused && !this.state.selecting) {
      updatePreview(cx, target, tokenPos, editor.codeMirror);
    }
  };

  onTokenLeave = e => {
    console.log("Token leave: ", e);
  };

  onMouseUp = () => {
    if (this.props.cx?.isPaused) {
      this.setState({ selecting: false });
      return true;
    }
  };

  onMouseDown = () => {
    if (this.props.cx?.isPaused) {
      this.setState({ selecting: true });
      return true;
    }
  };

  onScroll = () => {
    const { clearPreview, cx, preview } = this.props;
    if (cx?.isPaused && preview) {
      clearPreview(cx, preview.previewId);
    }
  };

  render() {
    const { preview } = this.props;
    const { selecting } = this.state;

    return (
      <>
        {!selecting && preview && (
          <PreviewHighlight expression={preview.expression} target={preview.target} />
        )}
        {!selecting && preview?.resultGrip && (
          <Popup preview={preview} editor={this.props.editor} editorRef={this.props.editorRef} />
        )}
      </>
    );
  }
}

export default connector(Preview);

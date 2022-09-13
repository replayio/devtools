/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { SourceLocation } from "@replayio/protocol";
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";
import debounce from "lodash/debounce";

import type { UIState } from "ui/state";

import Popup from "./Popup";

import { getPreview, getThreadContext } from "../../../selectors";
import actions from "../../../actions";
import { PreviewHighlight } from "./PreviewHighlight";

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

type PreviewState = {
  selecting: boolean;
  hoveredTarget: HTMLElement | null;
};

class Preview extends PureComponent<PreviewProps, PreviewState> {
  state = { selecting: false, hoveredTarget: null };

  componentDidMount() {
    this.updateListeners();
  }

  componentDidUpdate(prevProps: PreviewProps) {
    // Reset state on preview dismissal
    if (!this.props.preview && prevProps.preview && this.state.hoveredTarget) {
      this.setState({ hoveredTarget: null });
    }
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
    const { cx } = this.props;

    if (cx?.isPaused && !this.state.selecting) {
      this.startPreview(target, tokenPos);
    }
  };

  startPreview = debounce((target: HTMLElement, tokenPos: SourceLocation) => {
    const { cx, editor, updatePreview } = this.props;

    // Double-check status after timer runs
    if (cx?.isPaused && !this.state.selecting) {
      this.setState({ hoveredTarget: target });
      updatePreview(cx, target, tokenPos, editor.codeMirror);
    }
  }, 100);

  onTokenLeave = () => {
    this.startPreview.cancel();
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
    const { selecting, hoveredTarget } = this.state;

    return (
      <>
        {!selecting && preview && hoveredTarget && (
          <PreviewHighlight expression={preview.expression} target={hoveredTarget!} />
        )}
        {!selecting && preview?.value && hoveredTarget && (
          <Popup preview={preview} editorRef={this.props.editorRef} target={hoveredTarget!} />
        )}
      </>
    );
  }
}

export default connector(Preview);

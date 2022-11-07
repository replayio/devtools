import type { SourceLocation } from "@replayio/protocol";
import debounce from "lodash/debounce";
import { PureComponent, RefObject } from "react";
import { ConnectedProps, connect } from "react-redux";

import { updatePreview } from "devtools/client/debugger/src/actions/preview";
import { previewCleared } from "devtools/client/debugger/src/reducers/preview";
import { getPreview, getThreadContext } from "devtools/client/debugger/src/selectors";
import SourceEditor from "devtools/client/debugger/src/utils/editor/source-editor";
import { ReplayClientInterface } from "shared/client/types";
import type { UIState } from "ui/state";

import Popup from "./Popup";
import { PreviewHighlight } from "./PreviewHighlight";

const mapStateToProps = (state: UIState) => {
  return {
    cx: getThreadContext(state),
    preview: getPreview(state),
  };
};

const connector = connect(mapStateToProps, {
  previewCleared,
  updatePreview,
});

type PropsFromRedux = ConnectedProps<typeof connector>;
type PreviewProps = PropsFromRedux & {
  replayClient: ReplayClientInterface;
  editor: SourceEditor;
  containerRef: RefObject<HTMLDivElement>;
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

    // @ts-ignore This is our custom event type; arguably we should expected CodeMirror defs to include it
    codeMirror.off("tokenenter", this.onTokenEnter);
    // @ts-ignore This is our custom event type; arguably we should expected CodeMirror defs to include it
    codeMirror.off("tokenleave", this.onTokenLeave);
    codeMirror.off("scroll", this.onScroll);
    codeMirrorWrapper.removeEventListener("mouseup", this.onMouseUp);
    codeMirrorWrapper.removeEventListener("mousedown", this.onMouseDown);
  }

  updateListeners() {
    const { codeMirror } = this.props.editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();

    // @ts-ignore This is our custom event type; arguably we should expected CodeMirror defs to include it
    codeMirror.on("tokenenter", this.onTokenEnter);
    // @ts-ignore This is our custom event type; arguably we should expected CodeMirror defs to include it
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
    const { replayClient, cx, editor, updatePreview } = this.props;

    // Double-check status after timer runs
    if (cx?.isPaused && !this.state.selecting) {
      this.setState({ hoveredTarget: target });
      updatePreview(replayClient, cx, target, tokenPos, editor.codeMirror);
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
    const { previewCleared, cx, preview } = this.props;
    if (cx?.isPaused && preview) {
      previewCleared({ cx, previewId: preview.previewId });
    }
  };

  render() {
    const { containerRef, preview } = this.props;
    const { selecting, hoveredTarget } = this.state;

    return (
      <>
        {!selecting && preview && hoveredTarget && (
          <PreviewHighlight expression={preview.expression} target={hoveredTarget!} />
        )}
        {!selecting && preview?.value && hoveredTarget && (
          <Popup containerRef={containerRef} preview={preview} target={hoveredTarget!} />
        )}
      </>
    );
  }
}

export default connector(Preview);

import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { Location } from "@replayio/protocol";
import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getBreakpointPositionsAsync } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import classnames from "classnames";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import debounce from "lodash/debounce";
import PropTypes from "prop-types";
import React, { PureComponent, useContext } from "react";
import ReactDOM from "react-dom";
import { connect, ConnectedProps } from "react-redux";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point, PointId } from "shared/client/types";
import { openContextMenu, closeContextMenu } from "ui/actions/contextMenus";
import GutterContextMenu from "ui/components/ContextMenu/GutterContextMenu";
import { KeyModifiersContext } from "ui/components/KeyModifiers";
import { EditorNag, NAG_HEIGHT } from "ui/components/shared/Nags/Nags";
import { selectors } from "ui/reducers";
import { getContextMenu } from "ui/reducers/contextMenus";
import {
  getSelectedSource,
  getSelectedLocation,
  getSelectedSourceWithContent,
} from "ui/reducers/sources";
import { isFirefox } from "ui/utils/environment";
import { LoadingStatus } from "ui/utils/LoadingStatus";
import type { UIState } from "ui/state";

import actions from "../../actions";
import {
  showSourceText,
  showLoading,
  showErrorMessage,
  getEditor,
  clearEditor,
  getCursorLine,
  lineAtHeight,
  fromEditorLine,
  getDocument,
  scrollToColumn,
  toEditorLine,
  toEditorColumn,
  getSourceLocationFromMouseEvent,
  hasDocument,
  onTokenMouseOver,
  onLineMouseOver,
  onMouseScroll,
  startOperation,
  endOperation,
  clearDocuments,
} from "../../utils/editor";
import type { SourceEditor } from "../../utils/editor/source-editor";
import { getIndentation } from "../../utils/indentation";
import { resizeToggleButton, resizeBreakpointGutter } from "../../utils/ui";

import Breakpoints from "./Breakpoints/Breakpoints";
import ColumnBreakpoints from "./ColumnBreakpoints";
import DebugLine from "./DebugLine";
import EditorLoadingBar from "./EditorLoadingBar";
import EditorMenu from "./EditorMenu";
import EmptyLines from "./EmptyLines";
import Gutter from "./Gutter";
import HighlightLine from "./HighlightLine";
import HighlightLines from "./HighlightLines";
import LineNumberTooltip from "./LineNumberTooltip";
import Preview from "./Preview";
import SearchBar from "./SearchBar";
import { ReplayClientInterface, SourceLocationRange } from "shared/client/types";

const cssVars = {
  searchbarHeight: "var(--editor-searchbar-height)",
};

const mapStateToProps = (state: UIState) => {
  const selectedSource = getSelectedSource(state);
  const selectedSourceContent = getSelectedSourceWithContent(state);

  return {
    cx: selectors.getThreadContext(state),
    contextMenu: getContextMenu(state),
    selectedLocation: getSelectedLocation(state),
    selectedSource,
    selectedSourceContent,
    searchOn: selectors.getActiveSearch(state) === "file",
    symbols: selectors.getSymbols(state, selectedSource as any),
    selectedFrame: selectors.getSelectedFrame(state),
    mode: selectors.getViewMode(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  ...bindActionCreators(
    {
      closeContextMenu,
      closeTab: actions.closeTab,
      openContextMenu,
      traverseResults: actions.traverseResults,
      updateCursorPosition: actions.updateCursorPosition,
      updateViewport: actions.updateViewport,
    },
    dispatch
  ),
});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & {
  addPoint: (partialPoint: Partial<Point> | null, location: Location) => void;
  deletePoints: (...id: PointId[]) => void;
  editPoint: (id: PointId, partialPoint: Partial<Point>) => void;
  points: Point[];
  replayClient: ReplayClientInterface;
  setHoveredLocation: (lineIndex: number | null, lineNumberNode: HTMLElement | null) => void;
  setVisibleLines: (startIndex: number | null, stopIndex: number | null) => void;
};

interface EditorState {
  contextMenu: any;
  editor: SourceEditor | null;
  highlightedLineRange: any;
}

class Editor extends PureComponent<Props, EditorState> {
  shortcuts = new KeyShortcuts({ window, target: document });
  $editorWrapper: any;
  lastClientX = 0;
  lastClientY = 0;

  constructor(props: Props) {
    super(props);

    this.state = {
      contextMenu: null,
      editor: null,
      highlightedLineRange: null,
    };
  }

  componentDidMount() {
    this.shortcuts.on("CmdOrCtrl+W", this.onClosePress);
    this.shortcuts.on("Esc", this.onEscape);
    this.updateEditor(this.props);
  }

  getChildContext = () => {
    return { shortcuts: this.shortcuts };
  };

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    this.updateEditor(nextProps);
  }

  updateEditor(props: Props) {
    let editor = this.state.editor;

    if (!this.state.editor && props.selectedSource) {
      editor = this.setupEditor();
    }

    startOperation();
    this.setText(props, editor!);
    this.scrollToLocation(props, editor!);
    endOperation();

    if (this.props.selectedSource != props.selectedSource) {
      this.props.updateViewport();
      resizeBreakpointGutter(editor!.codeMirror);
      resizeToggleButton(editor!.codeMirror);
    }
  }

  setupEditor() {
    const editor: SourceEditor = getEditor();

    // disables the default search shortcuts
    // @ts-expect-error initShortcuts doesn't exist
    editor._initShortcuts = () => {};
    const node = ReactDOM.findDOMNode(this);

    if (node instanceof HTMLElement) {
      const editorMount: HTMLElement = node.querySelector(".editor-mount")!;
      while (editorMount.firstChild) {
        editorMount.removeChild(editorMount.firstChild);
      }
      editor.appendToLocalElement(editorMount);
    }

    const { codeMirror } = editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();

    // @ts-expect-error event doesn't exist?
    codeMirror.on("gutterClick", this.onGutterClick);
    // @ts-ignore Custom event dispatched by devtools/client/debugger/src/utils/editor/line-events
    codeMirror.on("lineMouseEnter", this.onLineMouseEnter);
    // @ts-ignore Custom event dispatched by devtools/client/debugger/src/utils/editor/line-events
    codeMirror.on("lineMouseLeave", this.onLineMouseLeaveDebounced);

    // Set code editor wrapper to be focusable
    codeMirrorWrapper.tabIndex = 0;
    codeMirrorWrapper.addEventListener("keydown", e => this.onKeyDown(e));
    codeMirrorWrapper.addEventListener("click", e => this.onClick(e));
    codeMirrorWrapper.addEventListener("mouseover", onTokenMouseOver(codeMirror));
    codeMirrorWrapper.addEventListener("mouseover", onLineMouseOver(codeMirror));

    document.addEventListener("mousemove", e => {
      // Store mouse coords so we can use them when checking the mouse location
      // during a CodeMirror "scroll" event
      this.lastClientX = e.clientX;
      this.lastClientY = e.clientY;
    });

    if (!isFirefox()) {
      codeMirror.on("gutterContextMenu", (cm, line, eventName, event) =>
        this.onGutterContextMenu(event)
      );
      codeMirror.on("contextmenu", (cm, event) => this.openMenu(event));
    } else {
      codeMirrorWrapper.addEventListener("contextmenu", event => this.openMenu(event));
    }

    codeMirror.on("scroll", this.onEditorScroll);
    this.onEditorScroll();
    this.setState({ editor });

    return editor;
  }

  onClosePress = (e: React.MouseEvent) => {
    const { cx, selectedSource } = this.props;
    if (selectedSource) {
      e.preventDefault();
      e.stopPropagation();
      this.props.closeTab(cx, selectedSource);
    }
  };

  componentWillUnmount() {
    const { editor } = this.state;
    if (editor) {
      editor.destroy();
      clearDocuments();

      const { codeMirror } = editor;
      codeMirror.off("scroll", this.onEditorScroll);
      // @ts-ignore Custom event dispatched by devtools/client/debugger/src/utils/editor/line-events
      codeMirror.off("lineMouseEnter", this.onLineMouseEnter);
      // @ts-ignore Custom event dispatched by devtools/client/debugger/src/utils/editor/line-events
      codeMirror.off("lineMouseLeave", this.onLineMouseLeaveDebounced);

      this.setState({ editor: null });
    }

    const shortcuts = this.shortcuts;
    shortcuts.off("CmdOrCtrl+W");
    shortcuts.off("CmdOrCtrl+B");
  }

  getCurrentLine() {
    const { codeMirror } = this.state.editor!;
    const { selectedSource } = this.props;
    if (!selectedSource) {
      return;
    }

    const line = getCursorLine(codeMirror);
    return fromEditorLine(line);
  }

  onEditorScroll = debounce(() => {
    const { updateViewport, setVisibleLines } = this.props;
    const { editor } = this.state;

    updateViewport();

    if (!editor) {
      return;
    }

    if (this.lastClientX && this.lastClientY) {
      onMouseScroll(editor.codeMirror, this.lastClientX, this.lastClientY);
    }

    setVisibleLines(editor.editor.display.viewFrom, editor.editor.display.viewTo);
  }, 75);

  onKeyDown(e: KeyboardEvent) {
    const { codeMirror } = this.state.editor!;
    const { key, target } = e;
    const codeWrapper = codeMirror.getWrapperElement();
    const textArea = codeWrapper.querySelector("textArea");

    if (key === "ArrowRight" || key === "ArrowLeft") {
      e.preventDefault();
      return;
    }
    if (key === "Escape" && target == textArea) {
      e.stopPropagation();
      e.preventDefault();
      codeWrapper.focus();
    } else if (key === "Enter" && target == codeWrapper) {
      e.preventDefault();
      // Focus into editor's text area
      (textArea as HTMLElement)!.focus();
    }
  }

  /*
   * The default Esc command is overridden in the CodeMirror keymap to allow
   * the Esc keypress event to be catched by the toolbox and trigger the
   * split console. Restore it here, but preventDefault if and only if there
   * is a multiselection.
   */
  onEscape = (e: React.KeyboardEvent) => {
    if (!this.state.editor) {
      return;
    }

    const { codeMirror } = this.state.editor;
    if (codeMirror.listSelections().length > 1) {
      codeMirror.execCommand("singleSelection");
      e.preventDefault();
    }
  };

  openMenu(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    const { selectedSource } = this.props;
    const { editor } = this.state;
    if (!selectedSource || !editor) {
      return;
    }

    const target = event.target;
    const line = lineAtHeight(editor, event);

    if (typeof line != "number") {
      return;
    }

    if ((target as HTMLElement).getAttribute("id") === "columnmarker") {
      return;
    }

    this.setState({ contextMenu: event });
  }

  clearContextMenu = () => {
    this.setState({ contextMenu: null });
  };

  onGutterClick = async (cm: any, lineIndex: number, gutter: any, clickEvent: MouseEvent) => {
    const { addPoint, deletePoints, editPoint, points, replayClient, selectedSource } = this.props;
    const { editor } = this.state;

    if (editor == null || selectedSource == null) {
      return;
    }

    if (typeof lineIndex !== "number") {
      return;
    }

    // ignore right clicks in the gutter
    if ((clickEvent.ctrlKey && clickEvent.button === 0) || clickEvent.button === 2) {
      return;
    }

    // Don't add a breakpoint if the user clicked on something other than the gutter line number,
    // e.g., the blank gutter space caused by adding a CodeMirror widget.
    if (![...(clickEvent.target as HTMLElement).classList].includes("CodeMirror-linenumber")) {
      return;
    }

    const line = lineIndex + 1;
    const locationRange = {
      start: { line, column: 0 },
      end: { line, column: Number.MAX_SAFE_INTEGER },
    };
    const breakpoints = await getBreakpointPositionsAsync(
      replayClient,
      selectedSource.id,
      locationRange
    );
    if (breakpoints.length === 0) {
      return;
    }
    const breakpointsForLine = breakpoints.find(breakpoint => breakpoint.line === line);
    if (breakpointsForLine == null || breakpointsForLine.columns.length === 0) {
      return;
    }

    const firstBreakableColumn = breakpointsForLine.columns[0];

    const location: Location = {
      column: firstBreakableColumn,
      line,
      sourceId: selectedSource.id,
    };

    const existingPoint = points.find(
      point =>
        point.location.sourceId === location.sourceId &&
        point.location.line === location.line &&
        point.location.column === location.column
    );

    if (existingPoint != null) {
      if (existingPoint.shouldBreak) {
        if (existingPoint.shouldLog) {
          editPoint(existingPoint.id, { shouldBreak: false });
        } else {
          deletePoints(existingPoint.id);
        }
      } else {
        editPoint(existingPoint.id, { shouldBreak: true });
      }
    } else {
      addPoint({ shouldBreak: true }, location);
    }
  };

  onGutterContextMenu = (event: MouseEvent) => {
    return this.openMenu(event);
  };

  onLineMouseEnter = ({
    lineIndex,
    lineNumberNode,
  }: {
    lineIndex: number;
    lineNumberNode: HTMLElement;
  }) => {
    const { setHoveredLocation } = this.props;

    this.onLineMouseLeaveDebounced.cancel();

    setHoveredLocation(lineIndex, lineNumberNode);
  };

  // Only reset the Redux state here after a short delay.
  // That way, if we immediately mouse from active line X to X + 1,
  // we won't dispatch a "reset line to null" action as part of that change.
  // This avoids causing the `{lower, upper} selector to think we're at range 0..100,
  // which was causing many unnecessary gutter marker updates.
  // Note that mousing over an inactive line _will_ cause us to clear this line number.
  onLineMouseLeaveDebounced = debounce(() => {
    const { setHoveredLocation } = this.props;

    setHoveredLocation(null, null);
  }, 50);

  onClick(e: MouseEvent) {
    const { selectedSource, updateCursorPosition } = this.props;

    if (selectedSource) {
      const sourceLocation = getSourceLocationFromMouseEvent(
        this.state.editor!,
        selectedSource as any,
        e
      );

      updateCursorPosition(sourceLocation);
    }
  }

  shouldScrollToLocation(nextProps: Props, editor: SourceEditor) {
    const { selectedLocation, selectedSourceContent } = this.props;
    if (
      !editor ||
      !nextProps.selectedSourceContent ||
      !nextProps.selectedLocation ||
      !nextProps.selectedLocation.line ||
      !nextProps.selectedSourceContent.value
    ) {
      return false;
    }

    const isFirstLoad =
      (!selectedSourceContent || !selectedSourceContent.value) &&
      nextProps.selectedSourceContent.value;
    const locationChanged = selectedLocation !== nextProps.selectedLocation;
    const symbolsChanged = nextProps.symbols != this.props.symbols;

    return isFirstLoad || locationChanged || symbolsChanged;
  }

  scrollToLocation(nextProps: Props, editor: SourceEditor) {
    const { selectedLocation, selectedSource } = nextProps;

    if (selectedLocation && this.shouldScrollToLocation(nextProps, editor)) {
      const line = toEditorLine(selectedLocation.line);
      let column: number | undefined;

      if (selectedSource && hasDocument(selectedSource.id)) {
        const doc = getDocument(selectedSource.id);
        const lineText = doc.getLine(line);
        column = toEditorColumn(lineText, selectedLocation.column || 0);
        column = Math.max(column, getIndentation(lineText));
      }

      scrollToColumn(editor.codeMirror, line, column!);
    }
  }

  setText(props: Props, editor: SourceEditor) {
    const { selectedSource, selectedSourceContent, symbols } = props;
    if (!editor) {
      return;
    }

    // check if we previously had a selected source
    if (!selectedSource || !selectedSourceContent) {
      return this.clearEditor();
    }

    if (!selectedSourceContent.value) {
      return showLoading(editor);
    }

    if (selectedSourceContent.status === LoadingStatus.ERRORED) {
      let { value } = selectedSourceContent.value;
      if (typeof value !== "string") {
        value = "Unexpected source error";
      }

      return this.showErrorMessage(value);
    }

    return showSourceText(editor, selectedSource, selectedSourceContent.value, symbols as any);
  }

  clearEditor() {
    const { editor } = this.state;
    if (!editor) {
      return;
    }

    clearEditor(editor);
  }

  showErrorMessage(msg: string) {
    const { editor } = this.state;
    if (!editor) {
      return;
    }

    showErrorMessage(editor, msg);
  }

  getInlineEditorStyles() {
    const { searchOn } = this.props;

    const isNagShown = !!this.$editorWrapper?.querySelector(".nag-hat");
    return {
      height: `calc(100% - ${searchOn ? cssVars.searchbarHeight : "0px"} - ${
        isNagShown ? NAG_HEIGHT : "0px"
      })`,
    };
  }

  renderItems() {
    const { selectedSource, closeContextMenu, contextMenu: gutterContextMenu } = this.props;
    const { contextMenu, editor } = this.state;

    if (!selectedSource || !editor) {
      return null;
    }

    if (!getDocument(selectedSource.id)) {
      return <EditorLoadingBar />;
    }

    return (
      <div>
        {gutterContextMenu && (
          <GutterContextMenu contextMenu={gutterContextMenu} close={closeContextMenu} />
        )}
        <DebugLine />
        <HighlightLine />
        <EmptyLines editor={editor} />
        <Breakpoints editor={editor} />
        <Preview editor={editor} editorRef={this.$editorWrapper} />
        <KeyModifiersContext.Consumer>
          {keyModifiers => <LineNumberTooltip editor={editor} keyModifiers={keyModifiers} />}
        </KeyModifiersContext.Consumer>
        <HighlightLines editor={editor} />
        <EditorMenu
          editor={editor}
          contextMenu={contextMenu}
          clearContextMenu={this.clearContextMenu}
          selectedSource={selectedSource}
        />
        <ColumnBreakpoints editor={editor} />
        <Gutter sourceEditor={editor} />
      </div>
    );
  }

  renderSearchBar() {
    const { editor } = this.state;

    if (!this.props.selectedSource) {
      return null;
    }

    return <SearchBar editor={editor} />;
  }

  render() {
    return (
      <div
        className={classnames("editor-wrapper", {
          showLineHits: true,
        })}
        ref={c => (this.$editorWrapper = c)}
      >
        <EditorNag />
        <div className="editor-mount devtools-monospace" style={this.getInlineEditorStyles()} />
        {this.renderSearchBar()}
        {this.renderItems()}
      </div>
    );
  }
}

// @ts-expect-error context shenanigans
Editor.childContextTypes = {
  shortcuts: PropTypes.object,
};

const ConnectedEditor = connector(Editor);

export default function EditorWrapper() {
  const { addPoint, deletePoints, editPoint, points } = useContext(PointsContext);
  const { setHoveredLocation, setVisibleLines } = useContext(SourcesContext);

  const replayClient = useContext(ReplayClientContext);

  return (
    <ConnectedEditor
      addPoint={addPoint}
      deletePoints={deletePoints}
      editPoint={editPoint}
      points={points}
      replayClient={replayClient}
      setHoveredLocation={setHoveredLocation}
      setVisibleLines={setVisibleLines}
    />
  );
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import debounce from "lodash/debounce";
import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { bindActionCreators, Dispatch } from "redux";
import { isFirefox } from "ui/utils/environment";

import { connect, ConnectedProps } from "react-redux";
import classnames from "classnames";

import type { UIState } from "ui/state";

import type { SourceEditor } from "../../utils/editor/source-editor";
import { getIndentation } from "../../utils/indentation";

import actions from "../../actions";

import SearchBar from "./SearchBar";
import Preview from "./Preview";
import Breakpoints from "./Breakpoints/Breakpoints";
import ColumnBreakpoints from "./ColumnBreakpoints";
import GutterContextMenu from "ui/components/ContextMenu/GutterContextMenu";
import DebugLine from "./DebugLine";
import EmptyLines from "./EmptyLines";
import EditorMenu from "./EditorMenu";
import LineNumberTooltip from "./LineNumberTooltip";
import HighlightLine from "./HighlightLine";
import HighlightLines from "./HighlightLines";
import EditorLoadingBar from "./EditorLoadingBar";
import { EditorNag } from "ui/components/shared/Nags/Nags";
import { KeyModifiersContext } from "ui/components/KeyModifiers";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";

import {
  getSelectedSource,
  getSelectedLocation,
  getSelectedSourceWithContent,
  LoadingStatus,
} from "ui/reducers/sources";

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
  startOperation,
  endOperation,
  clearDocuments,
} from "../../utils/editor";
import Gutter from "./Gutter";

import { resizeToggleButton, resizeBreakpointGutter } from "../../utils/ui";

import { openContextMenu, closeContextMenu } from "ui/actions/contextMenus";
import { getContextMenu } from "ui/reducers/contextMenus";

import { selectors } from "ui/reducers";
import { NAG_HEIGHT, NAG_HAT_CLASS } from "ui/components/shared/Nags/Nags";
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
      addBreakpointAtLine: actions.addBreakpointAtLine,
      closeContextMenu,
      closeTab: actions.closeTab,
      openContextMenu,
      toggleBlackBox: actions.toggleBlackBox,
      traverseResults: actions.traverseResults,
      updateCursorPosition: actions.updateCursorPosition,
      updateViewport: actions.updateViewport,
    },
    dispatch
  ),
});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

interface EditorState {
  highlightedLineRange: any;
  editor: SourceEditor | null;
  contextMenu: any;
}

class Editor extends PureComponent<PropsFromRedux, EditorState> {
  shortcuts = new KeyShortcuts({ window, target: document });
  $editorWrapper: any;

  constructor(props: PropsFromRedux) {
    super(props);

    this.state = {
      highlightedLineRange: null,
      editor: null,
      contextMenu: null,
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

  UNSAFE_componentWillReceiveProps(nextProps: PropsFromRedux) {
    this.updateEditor(nextProps);
  }

  updateEditor(props: PropsFromRedux) {
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
      editor.appendToLocalElement(node.querySelector(".editor-mount")!);
    }

    const { codeMirror } = editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();

    // @ts-expect-error event doesn't exist?
    codeMirror.on("gutterClick", this.onGutterClick);

    // Set code editor wrapper to be focusable
    codeMirrorWrapper.tabIndex = 0;
    codeMirrorWrapper.addEventListener("keydown", e => this.onKeyDown(e));
    codeMirrorWrapper.addEventListener("click", e => this.onClick(e));
    codeMirrorWrapper.addEventListener("mouseover", onTokenMouseOver(codeMirror));
    codeMirrorWrapper.addEventListener("mouseover", onLineMouseOver(codeMirror));

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
    if (this.state.editor) {
      this.state.editor.destroy();
      clearDocuments();
      this.state.editor.codeMirror.off("scroll", this.onEditorScroll);
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

  onEditorScroll = debounce(this.props.updateViewport, 75);

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

  onGutterClick = (cm: any, line: number, gutter: any, ev: MouseEvent) => {
    const { cx, selectedSource, addBreakpointAtLine, toggleBlackBox } = this.props;
    const sourceLocation = getSourceLocationFromMouseEvent(
      this.state.editor!,
      selectedSource as any,
      ev
    );

    // ignore right clicks in the gutter
    if ((ev.ctrlKey && ev.button === 0) || ev.button === 2 || !selectedSource) {
      return;
    }

    // if user clicks gutter to set breakpoint on blackboxed source, un-blackbox the source.
    // TODO Re-enable blackboxing
    /*
    if (selectedSource && selectedSource.isBlackBoxed) {
      toggleBlackBox(cx, selectedSource);
    }
    */

    if (typeof line !== "number") {
      return;
    }

    const sourceLine = fromEditorLine(line);

    // Don't add a breakpoint if the user clicked on something other than the gutter line number,
    // e.g., the blank gutter space caused by adding a CodeMirror widget.
    if (![...(ev.target as HTMLElement).classList].includes("CodeMirror-linenumber")) {
      return;
    }

    return addBreakpointAtLine(cx, sourceLine);
  };

  onGutterContextMenu = (event: MouseEvent) => {
    return this.openMenu(event);
  };

  onClick(e: MouseEvent) {
    const { cx, selectedSource, updateCursorPosition } = this.props;

    if (selectedSource) {
      const sourceLocation = getSourceLocationFromMouseEvent(
        this.state.editor!,
        selectedSource as any,
        e
      );

      updateCursorPosition(sourceLocation);
    }
  }

  shouldScrollToLocation(nextProps: PropsFromRedux, editor: SourceEditor) {
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

  scrollToLocation(nextProps: PropsFromRedux, editor: SourceEditor) {
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

  setText(props: PropsFromRedux, editor: SourceEditor) {
    const { selectedSourceContent, symbols } = props;
    if (!editor) {
      return;
    }

    // check if we previously had a selected source
    if (!selectedSourceContent) {
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

    return showSourceText(
      editor,
      selectedSourceContent,
      selectedSourceContent.value,
      symbols as any
    );
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
    const { cx, selectedSource, closeContextMenu, contextMenu: gutterContextMenu } = this.props;
    const { editor, contextMenu } = this.state;

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
        <Breakpoints editor={editor} cx={cx} />
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
        <Gutter editor={editor} />
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
    const { selectedSource } = this.props;

    return (
      <div
        className={classnames("editor-wrapper", {
          // TODO Re-enable blackboxing
          /*
          blackboxed: selectedSource && selectedSource.isBlackBoxed,
          */
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

export default connector(Editor);

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import debounce from "lodash/debounce";
import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { bindActionCreators } from "redux";
import { isFirefox } from "ui/utils/environment";

import { connect } from "react-redux";
import classnames from "classnames";

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
import { getSelectedSourceDetails, LoadingState } from "ui/reducers/sources";
import { getSelectedSource } from "../../selectors";
const cssVars = {
  searchbarHeight: "var(--editor-searchbar-height)",
};

class Editor extends PureComponent {
  $editorWrapper;
  constructor(props) {
    super(props);

    this.shortcuts = new KeyShortcuts({ window, target: document });

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

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.updateEditor(nextProps);
  }

  updateEditor(props) {
    let editor = this.state.editor;

    if (!this.state.editor && props.sourceContent) {
      editor = this.setupEditor();
    }

    startOperation();
    this.setText(props, editor);
    this.scrollToLocation(props, editor);
    endOperation();

    if (this.props.sourceContent != props.sourceContent) {
      this.props.updateViewport();
      resizeBreakpointGutter(editor.codeMirror);
      resizeToggleButton(editor.codeMirror);
    }
  }

  setupEditor() {
    const editor = getEditor();

    // disables the default search shortcuts
    editor._initShortcuts = () => {};
    const node = ReactDOM.findDOMNode(this);
    if (node instanceof HTMLElement) {
      editor.appendToLocalElement(node.querySelector(".editor-mount"));
    }

    const { codeMirror } = editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();

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

  onClosePress = e => {
    const { cx, sourceContent } = this.props;
    if (sourceContent) {
      e.preventDefault();
      e.stopPropagation();
      this.props.closeTab(cx, sourceContent);
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
    const { codeMirror } = this.state.editor;
    const { sourceContent } = this.props;
    if (!sourceContent) {
      return;
    }

    const line = getCursorLine(codeMirror);
    return fromEditorLine(line);
  }

  onEditorScroll = debounce(this.props.updateViewport, 75);

  onKeyDown(e) {
    const { codeMirror } = this.state.editor;
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
      textArea.focus();
    }
  }

  /*
   * The default Esc command is overridden in the CodeMirror keymap to allow
   * the Esc keypress event to be catched by the toolbox and trigger the
   * split console. Restore it here, but preventDefault if and only if there
   * is a multiselection.
   */
  onEscape = e => {
    if (!this.state.editor) {
      return;
    }

    const { codeMirror } = this.state.editor;
    if (codeMirror.listSelections().length > 1) {
      codeMirror.execCommand("singleSelection");
      e.preventDefault();
    }
  };

  openMenu(event) {
    event.stopPropagation();
    event.preventDefault();

    const { sourceContent } = this.props;
    const { editor } = this.state;
    if (!sourceContent || !editor) {
      return;
    }

    const target = event.target;
    const line = lineAtHeight(editor, event);

    if (typeof line != "number") {
      return;
    }

    if (target.getAttribute("id") === "columnmarker") {
      return;
    }

    this.setState({ contextMenu: event });
  }

  clearContextMenu = () => {
    this.setState({ contextMenu: null });
  };

  onGutterClick = (cm, line, gutter, ev) => {
    const { cx, sourceContent, sourceDetails, addBreakpointAtLine, toggleBlackBox } = this.props;
    const sourceLocation = getSourceLocationFromMouseEvent(this.state.editor, sourceContent, ev);

    // ignore right clicks in the gutter
    if ((ev.ctrlKey && ev.button === 0) || ev.button === 2 || !sourceContent) {
      return;
    }

    // if user clicks gutter to set breakpoint on blackboxed source, un-blackbox the source.
    if (sourceDetails && sourceDetails.isBlackBoxed) {
      toggleBlackBox(cx, sourceDetails);
    }

    if (typeof line !== "number") {
      return;
    }

    const sourceLine = fromEditorLine(line);

    // Don't add a breakpoint if the user clicked on something other than the gutter line number,
    // e.g., the blank gutter space caused by adding a CodeMirror widget.
    if (![...ev.target.classList].includes("CodeMirror-linenumber")) {
      return;
    }

    return addBreakpointAtLine(cx, sourceLine);
  };

  onGutterContextMenu = event => {
    return this.openMenu(event);
  };

  onClick(e) {
    const { cx, sourceContent, updateCursorPosition, jumpToMappedLocation } = this.props;

    if (sourceContent) {
      const sourceLocation = getSourceLocationFromMouseEvent(this.state.editor, sourceContent, e);

      if (e.metaKey && e.altKey) {
        jumpToMappedLocation(cx, sourceLocation);
      }

      updateCursorPosition(sourceLocation);
    }
  }

  shouldScrollToLocation(nextProps, editor) {
    const { selectedLocation, sourceContent } = this.props;
    if (
      !editor ||
      !nextProps.sourceContent ||
      !nextProps.selectedLocation ||
      !nextProps.selectedLocation.line ||
      !nextProps.sourceContent.content
    ) {
      return false;
    }

    const isFirstLoad =
      (!sourceContent || !sourceContent.content) && nextProps.sourceContent.content;
    const locationChanged = selectedLocation !== nextProps.selectedLocation;
    const symbolsChanged = nextProps.symbols != this.props.symbols;

    return isFirstLoad || locationChanged || symbolsChanged;
  }

  scrollToLocation(nextProps, editor) {
    const { selectedLocation, sourceContent } = nextProps;

    if (selectedLocation && this.shouldScrollToLocation(nextProps, editor)) {
      const line = toEditorLine(selectedLocation.line);
      let column;

      if (sourceContent && hasDocument(sourceContent.id)) {
        const doc = getDocument(sourceContent.id);
        const lineText = doc.getLine(line);
        column = toEditorColumn(lineText, selectedLocation.column);
        column = Math.max(column, getIndentation(lineText));
      }

      scrollToColumn(editor.codeMirror, line, column);
    }
  }

  setText(props, editor) {
    const { sourceContent, symbols } = props;
    console.log({ sourceContent });
    if (!editor) {
      return;
    }

    // check if we previously had a selected source
    if (!sourceContent) {
      return this.clearEditor();
    }

    console.log({ sourceContent });
    if (!sourceContent.value) {
      return showLoading(editor);
    }

    if (sourceContent.status === LoadingState.ERRORED) {
      let { value } = sourceContent.content;
      if (typeof value !== "string") {
        value = "Unexpected source error";
      }

      return this.showErrorMessage(value);
    }

    return showSourceText(editor, sourceContent, sourceContent, symbols);
  }

  clearEditor() {
    const { editor } = this.state;
    if (!editor) {
      return;
    }

    clearEditor(editor);
  }

  showErrorMessage(msg) {
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
    const {
      cx,
      sourceContent,
      sourceDetails,
      closeContextMenu,
      contextMenu: gutterContextMenu,
    } = this.props;
    const { editor, contextMenu } = this.state;

    if (!sourceContent || !editor) {
      return null;
    }

    if (!getDocument(sourceContent.id)) {
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
          sourceDetails={sourceDetails}
        />
        <ColumnBreakpoints editor={editor} />
        <Gutter editor={editor} />
      </div>
    );
  }

  renderSearchBar() {
    const { editor } = this.state;

    if (!this.props.sourceContent) {
      return null;
    }

    return <SearchBar editor={editor} />;
  }

  render() {
    const { sourceContent } = this.props;

    return (
      <div
        className={classnames("editor-wrapper", {
          blackboxed: sourceContent && sourceContent.isBlackBoxed,
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

Editor.childContextTypes = {
  shortcuts: PropTypes.object,
};

const mapStateToProps = state => {
  const sourceContent = selectors.getSelectedSourceWithContent(state);
  const sourceDetails = getSelectedSourceDetails(state);

  return {
    cx: selectors.getThreadContext(state),
    contextMenu: getContextMenu(state),
    selectedLocation: selectors.getSelectedLocation(state),
    sourceContent,
    sourceDetails,
    searchOn: selectors.getActiveSearch(state) === "file",
    symbols: selectors.getSymbols(state, sourceContent),
    selectedFrame: selectors.getSelectedFrame(state),
    mode: selectors.getViewMode(state),
  };
};

const mapDispatchToProps = dispatch => ({
  ...bindActionCreators(
    {
      addBreakpointAtLine: actions.addBreakpointAtLine,
      closeContextMenu,
      closeTab: actions.closeTab,
      jumpToMappedLocation: actions.jumpToMappedLocation,
      openContextMenu,
      toggleBlackBox: actions.toggleBlackBox,
      traverseResults: actions.traverseResults,
      updateCursorPosition: actions.updateCursorPosition,
      updateViewport: actions.updateViewport,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Editor);

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import actions from "devtools/client/webconsole/actions/index";
import { getFrameScope } from "devtools/client/debugger/src/reducers/pause";

import { getRecordingId } from "ui/utils/recording";
import { getRecording } from "ui/hooks/recordings";
import { getCommandHistory } from "../../selectors/messages";
import Autocomplete from "./Autocomplete";
import clamp from "lodash/clamp";
import {
  insertAutocompleteMatch,
  getAutocompleteMatches,
  getCursorIndex,
} from "../../utils/autocomplete";

async function createEditor({ onArrowPress, onEnter, onTab }) {
  await gToolbox.startPanel("debugger");
  const Editor = (await import("devtools/client/debugger/src/utils/editor/source-editor")).default;

  const editor = new Editor({
    autofocus: true,
    enableCodeFolding: false,
    lineNumbers: false,
    lineWrapping: true,
    mode: {
      name: "javascript",
      globalVars: true,
    },
    theme: "mozilla",
    styleActiveLine: false,
    tabIndex: "0",
    readOnly: false,
    viewportMargin: Infinity,
    disableSearchAddon: true,
    extraKeys: {
      Tab: onTab,
      Enter: onEnter,
      "Cmd-Enter": onEnter,
      "Ctrl-Enter": onEnter,
      Esc: false,
      "Cmd-F": false,
      "Ctrl-F": false,
      Up: () => onArrowPress("up"),
      Down: () => onArrowPress("down"),
    },
  });
  return editor;
}

class JSTerm extends React.Component {
  static get propTypes() {
    return {
      // Evaluate provided expression.
      evaluateExpression: PropTypes.func.isRequired,
      paywallExpression: PropTypes.func.isRequired,
    };
  }

  constructor(props) {
    super(props);
    window.jsterm = this;
    this.state = {
      canEval: true,
      historyIndex: 0,
      autocompleteIndex: 0,
      hideAutocomplete: false,
      charWidth: 0,
      value: "",
    };
  }

  async componentDidMount() {
    this.editorWaiter = createEditor({
      onArrowPress: this.onArrowPress,
      onEnter: this.onEnter,
      onTab: this.onTab,
    });
    this.editor = await this.editorWaiter;
    this.editor.appendToLocalElement(this.node);

    this.editor.codeMirror.on("change", this.onChange);
    this.editor.codeMirror.on("keydown", this.onKeyDown);
    this.editor.codeMirror.on("beforeSelectionChange", this.onBeforeSelectionChange);

    const recordingId = getRecordingId();
    const recording = await getRecording(recordingId);

    this.setState({
      canEval: recording.userRole !== "team-user",
      charWidth: this.editor.editor.display.cachedCharWidth,
    });
  }

  showAutocomplete() {
    const { value, hideAutocomplete } = this.state;
    const matches = this.getMatches();
    const matchCount = matches.length;

    // Bail if the only suggested autocomplete option has already been applied to the input.
    if (matchCount === 1 && insertAutocompleteMatch(value, matches[0]) === value) {
      return false;
    }

    return !hideAutocomplete && matchCount;
  }

  focus() {
    this.editor?.focus();
  }

  onArrowPress = arrow => {
    if (arrow === "up") {
      if (this.showAutocomplete()) {
        this.moveAutocompleteCursor(1);
      } else {
        this.moveHistoryCursor(1);
      }
    } else if (arrow === "down") {
      if (this.showAutocomplete()) {
        this.moveAutocompleteCursor(-1);
      } else {
        this.moveHistoryCursor(-1);
      }
    }
  };

  onEnter = async () => {
    if (!this.showAutocomplete()) {
      // this.execute();
      this.props.eagerEvalExpression(this.state.value);
    } else {
      const { autocompleteIndex } = this.state;
      const match = this.getMatches()[autocompleteIndex];

      this.selectAutocompleteMatch(match);
    }
  };

  onTab = () => {
    const { autocompleteIndex } = this.state;
    const match = this.getMatches()[autocompleteIndex];

    if (this.showAutocomplete()) {
      this.selectAutocompleteMatch(match);
    }
  };

  onMatchClick = match => {
    this.selectAutocompleteMatch(match);
  };

  selectAutocompleteMatch(match) {
    const { value } = this.state;

    const newValue = insertAutocompleteMatch(value, match);
    this.setValue(newValue);
  }

  moveAutocompleteCursor(difference) {
    const { autocompleteIndex } = this.state;
    const matchesCount = this.getMatches().length;

    const newIndex = (matchesCount + autocompleteIndex - difference) % matchesCount;
    this.setState({ autocompleteIndex: newIndex });
  }

  moveHistoryCursor(difference) {
    const { commandHistory } = this.props;
    if (commandHistory.length > 0) {
      const newIndex = clamp(this.state.historyIndex + difference, 0, commandHistory.length);

      this.setValue(["", ...commandHistory][newIndex]);
      this.setState({ historyIndex: newIndex });
    }
  }

  /**
   * Execute a string. Execution happens asynchronously in the content process.
   */
  execute = () => {
    const executeString = this.getSelectedText() || this._getValue();
    if (!executeString) {
      return;
    }

    if (this.state.canEval) {
      this.props.evaluateExpression(executeString);
    } else {
      this.props.paywallExpression(executeString);
    }
    this.setValue("");
    this.setState({ historyIndex: 0 });
    return null;
  };

  /**
   * Sets the value of the input field.
   *
   * @param string newValue
   *        The new value to set.
   * @returns void
   */
  setValue = (newValue = "") => {
    // In order to get the autocomplete popup to work properly, we need to set the
    // editor text and the cursor in the same operation. If we don't, the text change
    // is done before the cursor is moved, and the autocompletion call to the server
    // sends an erroneous query.
    this.editor.codeMirror.operation(() => {
      this.editor.setText(newValue);

      // Set the cursor at the end of the input.
      const lines = newValue.split("\n");
      this.editor.setCursor({
        line: lines.length - 1,
        ch: lines[lines.length - 1].length,
      });
    });
  };

  /**
   * Gets the value from the input field
   * @returns string
   */
  _getValue() {
    return this.editor.getText() || "";
  }

  getSelectionStart() {
    return this.getInputValueBeforeCursor().length;
  }

  getSelectedText() {
    return this.editor.getSelection();
  }

  onKeyDown = (_, event) => {
    if (["Enter", "Tab", "Escape", "ArrowRight", "ArrowLeft"].includes(event.key)) {
      this.setState({ hideAutocomplete: true });
    } else {
      this.setState({ hideAutocomplete: false, autocompleteIndex: 0 });
    }
  };

  onChange = cm => {
    const value = cm.getValue();
    this.setState({ value });
  };

  onBeforeSelectionChange = (_, obj) => {
    const cursorMoved = ["*mouse", "+move"].includes(obj.origin);
    if (cursorMoved) {
      this.setState({ hideAutocomplete: true });
    }
  };

  getMatches() {
    const { frameScope } = this.props;
    const { value } = this.state;

    if (!value || !frameScope?.scope) {
      return [];
    }

    return getAutocompleteMatches(value, frameScope.scope);
  }

  render() {
    const { autocompleteIndex, value, charWidth } = this.state;
    const matches = this.getMatches();

    return (
      <div className="relative">
        <div
          className="jsterm-input-container devtools-input"
          key="jsterm-container"
          aria-live="off"
          tabIndex={-1}
          ref={node => {
            this.node = node;
          }}
        />
        {this.showAutocomplete() ? (
          <Autocomplete
            leftOffset={charWidth * getCursorIndex(value)}
            matches={matches}
            value={value}
            selectedIndex={autocompleteIndex}
            onMatchClick={this.onMatchClick}
          />
        ) : null}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    commandHistory: getCommandHistory(state),
    frameScope: getFrameScope(state, "0:0"),
  };
}

const mapDispatchToProp = {
  evaluateExpression: actions.evaluateExpression,
  eagerEvalExpression: actions.eagerEvalExpression,
  paywallExpression: actions.paywallExpression,
};

export default connect(mapStateToProps, mapDispatchToProp)(JSTerm);

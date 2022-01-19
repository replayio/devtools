/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import actions from "devtools/client/webconsole/actions/index";

import { getRecordingId } from "ui/utils/environment";
import { getRecording } from "ui/hooks/recordings";
import { getCommandHistory } from "../../selectors/messages";
import Autocomplete from "./Autocomplete";
import clamp from "lodash/clamp";

async function createEditor({ execute, onArrowPress }) {
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
      Enter: execute,
      "Cmd-Enter": execute,
      "Ctrl-Enter": execute,
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

  autocompleteShown = true;

  constructor(props) {
    super(props);
    window.jsterm = this;
    this.state = {
      canEval: true,
      historyIndex: 0,
      value: "",
      matchIndex: 0,
    };
  }

  async componentDidMount() {
    this.editorWaiter = createEditor({
      execute: this.execute,
      onArrowPress: this.onArrowPress,
    });
    this.editor = await this.editorWaiter;
    this.editor.appendToLocalElement(this.node);
    this.editor.codeMirror.on("change", this.onChange);

    const recordingId = getRecordingId();
    const recording = await getRecording(recordingId);

    this.setState({ canEval: recording.userRole !== "team-user" });
  }

  focus() {
    this.editor?.focus();
  }

  onArrowPress = arrow => {
    if (arrow === "up") {
      if (this.autocompleteShown) {
        console.log(">> Navigate the selected autocomplete index up");
        this.moveAutocompleteCursor(1);
      } else {
        this.moveHistoryCursor(1);
      }
    } else {
      if (this.autocompleteShown) {
        this.moveAutocompleteCursor(-1);
      } else {
        this.moveHistoryCursor(-1);
      }
    }
  };

  moveAutocompleteCursor(difference) {
    const { matchIndex } = this.state;
    if (difference > 0) {
      this.setState({ matchIndex: Math.max(matchIndex - 1, 0) });
      console.log(">> Navigate the selected autocomplete index up");
    } else {
      this.setState({ matchIndex: matchIndex + 1 });
      console.log(">> Navigate the selected autocomplete index down");
    }
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

    console.log({ executeString });

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

  onChange = cm => {
    const newValue = cm.getValue();
    this.setState({ value: newValue });
  };

  render() {
    const { value, matchIndex } = this.state;

    console.log({ matchIndex });

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
        {value || true ? <Autocomplete input={value} selectedIndex={matchIndex} /> : null}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    commandHistory: getCommandHistory(state),
  };
}

const mapDispatchToProp = {
  evaluateExpression: actions.evaluateExpression,
  paywallExpression: actions.paywallExpression,
};

export default connect(mapStateToProps, mapDispatchToProp)(JSTerm);

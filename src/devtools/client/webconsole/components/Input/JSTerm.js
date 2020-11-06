/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import React from "react";
import { connect } from "react-redux";
import Editor from "devtools/client/debugger/src/utils/editor/source-editor";
import PropTypes from "prop-types";
import actions from "devtools/client/webconsole/actions/index";

function createEditor({ execute }) {
  const editor = new Editor({
    autofocus: true,
    enableCodeFolding: false,
    lineNumbers: false,
    lineWrapping: true,
    mode: {
      name: "javascript",
      globalVars: true,
    },
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
    },
  });
  return editor;
}

class JSTerm extends React.Component {
  static get propTypes() {
    return {
      // Evaluate provided expression.
      evaluateExpression: PropTypes.func.isRequired,
    };
  }

  constructor(props) {
    super(props);
    window.jsterm = this;
  }

  componentDidMount() {
    this.editor = createEditor({ execute: this.execute });
    this.editor.appendToLocalElement(this.node);
  }

  focus() {
    this.editor.focus();
  }

  /**
   * Execute a string. Execution happens asynchronously in the content process.
   */
  execute = () => {
    const executeString = this.getSelectedText() || this._getValue();
    if (!executeString) {
      return;
    }

    this.props.evaluateExpression(executeString);
    this._setValue("");
    return null;
  };

  /**
   * Sets the value of the input field.
   *
   * @param string newValue
   *        The new value to set.
   * @returns void
   */
  _setValue(newValue = "") {
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
  }

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

  render() {
    return (
      <div
        className="jsterm-input-container devtools-input"
        key="jsterm-container"
        aria-live="off"
        tabIndex={-1}
        ref={node => {
          this.node = node;
        }}
      />
    );
  }
}

function mapStateToProps() {
  return {};
}

const mapDispatchToProp = {
  evaluateExpression: actions.evaluateExpression,
};

export default connect(mapStateToProps, mapDispatchToProp)(JSTerm);

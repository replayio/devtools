/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const React = require("react");
const { connect } = require("react-redux");
const Services = require("Services");
const isMacOS = Services.appinfo.OS === "Darwin";

const EventEmitter = require("devtools/shared/event-emitter");

const PropTypes = require("prop-types");
const Editor = require("devtools/client/shared/sourceeditor/editor");
const { l10n } = require("devtools/client/webconsole/utils/messages");
const actions = require("devtools/client/webconsole/actions/index");

class JSTerm extends React.Component {
  static get propTypes() {
    return {
      // Evaluate provided expression.
      evaluateExpression: PropTypes.func.isRequired,
    };
  }

  constructor(props) {
    super(props);

    EventEmitter.decorate(this);
    window.jsterm = this;
  }

  componentDidMount() {
    if (this.node) {
      const onArrowUp = () => {
        let inputUpdated;
        return inputUpdated ? null : "CodeMirror.Pass";
      };

      const onArrowDown = () => {
        let inputUpdated;
        return inputUpdated ? null : "CodeMirror.Pass";
      };

      const onArrowLeft = () => {
        return "CodeMirror.Pass";
      };

      const onArrowRight = () => {
        return "CodeMirror.Pass";
      };

      const onCtrlCmdEnter = () => {
        this._execute();
        return null;
      };

      this.editor = new Editor({
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
        viewportMargin: Infinity,
        disableSearchAddon: true,
        extraKeys: {
          Enter: () => {
            // No need to handle shift + Enter as it's natively handled by CodeMirror.
            this._execute();
            return null;
          },

          "Cmd-Enter": onCtrlCmdEnter,
          "Ctrl-Enter": onCtrlCmdEnter,

          [Editor.accel("S")]: () => {
            const value = this._getValue();
            if (!value) {
              return null;
            }

            const date = new Date();
            const suggestedName =
              `console-input-${date.getFullYear()}-` +
              `${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-` +
              `${date.getMinutes()}-${date.getSeconds()}.js`;
            const data = new TextEncoder().encode(value);
            return saveAs(window, data, suggestedName, [
              {
                pattern: "*.js",
                label: l10n.getStr("webconsole.input.openJavaScriptFileFilter"),
              },
            ]);
          },

          Tab: () => {
            if (this.hasEmptyInput()) {
              this.editor.codeMirror.getInputField().blur();
              return false;
            }

            // Something is selected, let the editor handle the indent.
            return true;
          },

          "Shift-Tab": () => {
            return "CodeMirror.Pass";
          },

          Up: onArrowUp,
          "Cmd-Up": onArrowUp,

          Down: onArrowDown,
          "Cmd-Down": onArrowDown,

          Left: onArrowLeft,
          "Ctrl-Left": onArrowLeft,
          "Cmd-Left": onArrowLeft,
          "Alt-Left": onArrowLeft,
          // On OSX, Ctrl-A navigates to the beginning of the line.
          "Ctrl-A": isMacOS ? onArrowLeft : undefined,

          Right: onArrowRight,
          "Ctrl-Right": onArrowRight,
          "Cmd-Right": onArrowRight,
          "Alt-Right": onArrowRight,
          Esc: false,
          "Cmd-F": false,
          "Ctrl-F": false,
        },
      });

      this.editor.appendToLocalElement(this.node);
    }
  }

  focus() {
    if (this.editor) {
      this.editor.focus();
    }
  }

  /**
   * Execute a string. Execution happens asynchronously in the content process.
   */
  _execute() {
    const executeString = this.getSelectedText() || this._getValue();
    if (!executeString) {
      return;
    }

    this.props.evaluateExpression(executeString);
    this._setValue("");
  }

  /**
   * Sets the value of the input field.
   *
   * @param string newValue
   *        The new value to set.
   * @returns void
   */
  _setValue(newValue = "") {
    if (this.editor) {
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
  }

  /**
   * Gets the value from the input field
   * @returns string
   */
  _getValue() {
    // FIXME
    return this.editor?.getText() || "";
  }

  getSelectionStart() {
    return this.getInputValueBeforeCursor().length;
  }

  getSelectedText() {
    return this.editor.getSelection();
  }

  /**
   * Test for empty input.
   *
   * @return boolean
   */
  hasEmptyInput() {
    return this._getValue() === "";
  }

  destroy() {}

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

function mapStateToProps(state) {
  return {};
}

const mapDispatchToProp = {
  evaluateExpression: actions.evaluateExpression,
};

module.exports = connect(mapStateToProps, mapDispatchToProp)(JSTerm);

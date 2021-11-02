/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { PureComponent } from "react";
import { connect } from "../../utils/connect";
import actions from "../../actions";
import {
  getSelectedSourceWithContent,
  getContext,
  getAlternateSourceId,
  getSource,
} from "../../selectors";

import { getFilename } from "../../utils/source";
import { ThreadFront } from "protocol/thread";
import { RedactedSpan } from "ui/components/Redacted";

// import "./Footer.css";

class SourceFooter extends PureComponent {
  constructor() {
    super();

    this.state = { cursorPosition: { line: 0, column: 0 } };
  }

  componentDidUpdate() {
    const eventDoc = document.querySelector(".editor-mount .CodeMirror");
    // querySelector can return null
    if (eventDoc) {
      this.toggleCodeMirror(eventDoc, true);
    }
  }

  componentWillUnmount() {
    const eventDoc = document.querySelector(".editor-mount .CodeMirror");

    if (eventDoc) {
      this.toggleCodeMirror(eventDoc, false);
    }
  }

  toggleCodeMirror(eventDoc, toggle) {
    if (toggle === true) {
      eventDoc.CodeMirror.on("cursorActivity", this.onCursorChange);
    } else {
      eventDoc.CodeMirror.off("cursorActivity", this.onCursorChange);
    }
  }

  renderSourceSummary() {
    const { alternateSource, selectedSource, showAlternateSource } = this.props;

    if (!alternateSource) {
      return null;
    }

    const filename = getFilename(alternateSource);
    const title = L10N.getFormatStr("sourceFooter.alternateSource", filename);

    const original = ThreadFront.isSourceMappedSource(selectedSource.id);

    const tooltip = L10N.getFormatStr(
      original ? "sourceFooter.generatedSourceTooltip" : "sourceFooter.originalSourceTooltip",
      filename
    );

    return (
      <button
        className="mapped-source"
        onClick={() => showAlternateSource(selectedSource, alternateSource)}
        title={tooltip}
      >
        <RedactedSpan data-redacted>{title}</RedactedSpan>
      </button>
    );
  }

  onCursorChange = event => {
    const { line, ch } = event.doc.getCursor();
    this.setState({ cursorPosition: { line, column: ch } });
  };

  renderCursorPosition() {
    if (!this.props.selectedSource) {
      return null;
    }

    const { line, column } = this.state.cursorPosition;

    const text = L10N.getFormatStr("sourceFooter.currentCursorPosition", line + 1, column + 1);
    const title = L10N.getFormatStr(
      "sourceFooter.currentCursorPosition.tooltip",
      line + 1,
      column + 1
    );
    return (
      <div className="cursor-position" title={title}>
        {text}
      </div>
    );
  }

  render() {
    return (
      <div className="source-footer">
        <div className="source-footer-end">
          {this.renderSourceSummary()}
          {this.renderCursorPosition()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const selectedSource = getSelectedSourceWithContent(state);
  const alternateSourceId = getAlternateSourceId(state, selectedSource);
  const alternateSource = alternateSourceId ? getSource(state, alternateSourceId) : null;

  return {
    cx: getContext(state),
    selectedSource,
    alternateSource,
  };
};

export default connect(mapStateToProps, {
  toggleBlackBox: actions.toggleBlackBox,
  showAlternateSource: actions.showAlternateSource,
  togglePaneCollapse: actions.togglePaneCollapse,
})(SourceFooter);

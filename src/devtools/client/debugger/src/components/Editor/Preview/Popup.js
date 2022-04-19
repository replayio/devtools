/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import actions from "devtools/client/debugger/src/actions";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import { connect } from "devtools/client/debugger/src/utils/connect";
import {
  highlightDomElement,
  unHighlightDomElement,
} from "devtools/client/webconsole/actions/toolbox";
import { ObjectInspector, MODE, Rep } from "devtools/packages/devtools-reps";
import React, { Component } from "react";

import Popover from "../../shared/Popover";
import PreviewFunction from "../../shared/PreviewFunction";

export class Popup extends Component {
  calculateMaxHeight = () => {
    const { editorRef } = this.props;
    if (!editorRef) {
      return "auto";
    }

    const { height, top } = editorRef.getBoundingClientRect();
    const maxHeight = height + top;
    if (maxHeight < 250) {
      return maxHeight;
    }

    return 250;
  };

  renderFunctionPreview() {
    const {
      cx,
      selectSourceURL,
      preview: { resultGrip },
    } = this.props;

    if (!resultGrip) {
      return null;
    }

    const location = resultGrip.functionLocation();
    const locationURL = resultGrip.functionLocationURL();

    return (
      <div
        className="preview-popup"
        onClick={() =>
          location &&
          selectSourceURL(cx, locationURL, {
            line: location.line,
          })
        }
      >
        <PreviewFunction func={resultGrip} />
      </div>
    );
  }

  renderObjectPreview() {
    const {
      preview: { root },
      openLink,
      openElementInInspector,
      highlightDomElement,
      unHighlightDomElement,
    } = this.props;

    if (root.getChildren().length == 0) {
      return (
        <div className="preview-popup">
          <span className="label">{"No properties"}</span>
        </div>
      );
    }

    return (
      <div className="preview-popup" style={{ maxHeight: this.calculateMaxHeight() }}>
        <ObjectInspector
          roots={() => root.getChildren()}
          autoExpandDepth={0}
          disableWrap={true}
          focusable={false}
          openLink={openLink}
          onDOMNodeClick={grip => openElementInInspector(grip)}
          onInspectIconClick={grip => openElementInInspector(grip)}
          onDOMNodeMouseOver={grip => highlightDomElement(grip)}
          onDOMNodeMouseOut={grip => unHighlightDomElement(grip)}
        />
      </div>
    );
  }

  renderSimplePreview() {
    const {
      openLink,
      preview: { resultGrip },
    } = this.props;
    return (
      <div className="preview-popup">
        {Rep({
          mode: MODE.LONG,
          object: resultGrip,
          openLink,
        })}
      </div>
    );
  }

  renderPreview() {
    // We don't have to check and
    // return on `false`, `""`, `0`, `undefined` etc,
    // these falsy simple typed value because we want to
    // do `renderSimplePreview` on these values below.
    const {
      preview: { root },
    } = this.props;

    if (root.type === "value") {
      if (root.isFunction()) {
        return this.renderFunctionPreview();
      }
      if (root.isObject()) {
        return <div>{this.renderObjectPreview()}</div>;
      }
    }

    return this.renderSimplePreview();
  }

  getPreviewType() {
    const {
      preview: { root },
    } = this.props;
    if (root.isPrimitive() || (root.type === "value" && root.isFunction())) {
      return "tooltip";
    }

    return "popover";
  }

  onMouseOut = () => {
    const { clearPreview, cx, preview } = this.props;
    clearPreview(cx, preview.previewId);
  };

  render() {
    const {
      preview: { cursorPos, resultGrip },
      editorRef,
    } = this.props;

    if (resultGrip.isUnavailable()) {
      return null;
    }

    const type = this.getPreviewType();
    return (
      <Popover
        targetPosition={cursorPos}
        type={type}
        editorRef={editorRef}
        target={this.props.preview.target}
        mouseout={this.onMouseOut}
      >
        {this.renderPreview()}
      </Popover>
    );
  }
}

const mapStateToProps = state => ({
  cx: getThreadContext(state),
});

const { selectSourceURL, openLink, openElementInInspectorCommand, clearPreview } = actions;

const mapDispatchToProps = {
  clearPreview,
  highlightDomElement,
  openElementInInspector: openElementInInspectorCommand,
  openLink,
  selectSourceURL,
  unHighlightDomElement,
};

export default connect(mapStateToProps, mapDispatchToProps)(Popup);

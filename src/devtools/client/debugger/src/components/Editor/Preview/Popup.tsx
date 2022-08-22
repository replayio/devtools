/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";

import type { UIState } from "ui/state";
import type { PreviewState } from "devtools/client/debugger/src/reducers/preview";

import { ObjectInspector, MODE, Rep } from "devtools/packages/devtools-reps";
import {
  highlightDomElement,
  unHighlightDomElement,
  openLink,
  openNodeInInspector,
} from "devtools/client/webconsole/actions/toolbox";
import { selectSourceURL } from "devtools/client/debugger/src/actions/sources/select";
import { clearPreview } from "devtools/client/debugger/src/actions/preview";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import { prefs as prefsService } from "devtools/shared/services";
import { getSourceDetailsEntities } from "ui/reducers/sources";

import Popover from "../../shared/Popover";
import PreviewFunction from "../../shared/PreviewFunction";

import NewObjectInspector from "./NewObjectInspector";
import { getPreferredLocation } from "ui/utils/preferredLocation";

type $FixTypeLater = any;

interface PopupProps {
  preview: PreviewState["preview"];
  editorRef: HTMLDivElement;
}

type FinalPopupProps = PropsFromRedux & PopupProps;

export class Popup extends Component<FinalPopupProps> {
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
    const { cx, sourcesById, selectSourceURL, preview } = this.props;
    const { resultGrip } = preview!;

    if (!resultGrip) {
      return null;
    }

    const location = getPreferredLocation(resultGrip.mappedFunctionLocation());
    const locationURL = location ? sourcesById[location.sourceId]?.url : undefined;

    return (
      <div
        className="preview-popup"
        onClick={() =>
          location &&
          locationURL &&
          selectSourceURL(cx, locationURL, {
            line: location.line,
            column: 0,
          })
        }
      >
        <PreviewFunction func={resultGrip} />
      </div>
    );
  }

  renderObjectPreview() {
    const {
      preview,
      openLink,
      openElementInInspector,
      highlightDomElement,
      unHighlightDomElement,
    } = this.props;
    const { root } = preview!;

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
          // @ts-expect-error prop mismatch? whatever
          openLink={openLink}
          onDOMNodeClick={(grip: $FixTypeLater) => openElementInInspector(grip)}
          onInspectIconClick={(grip: $FixTypeLater) => openElementInInspector(grip)}
          onDOMNodeMouseOver={(grip: $FixTypeLater) => highlightDomElement(grip)}
          onDOMNodeMouseOut={() => unHighlightDomElement()}
        />
      </div>
    );
  }

  renderSimplePreview() {
    const { openLink, preview } = this.props;

    const { resultGrip } = preview!;
    return (
      <div className="preview-popup">
        {Rep({
          object: resultGrip,
          mode: MODE.LONG,
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
    const { preview } = this.props;
    const { root } = preview!;

    const enableNewComponentArchitecture = prefsService.getBoolPref(
      "devtools.features.enableNewComponentArchitecture"
    );
    if (enableNewComponentArchitecture) {
      return <NewObjectInspector />;
    } else {
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
  }

  getPreviewType() {
    const { preview } = this.props;
    const { root } = preview!;
    if (root.isPrimitive() || (root.type === "value" && root.isFunction())) {
      return "tooltip";
    }

    return "popover";
  }

  onMouseOut = () => {
    const { clearPreview, cx, preview } = this.props;
    clearPreview(cx, preview!.previewId);
  };

  render() {
    const { preview, editorRef } = this.props;
    const { cursorPos, resultGrip } = preview!;

    if (resultGrip.isUnavailable()) {
      return null;
    }

    const type = this.getPreviewType();
    return (
      <Popover
        targetPosition={cursorPos}
        type={type}
        editorRef={editorRef}
        target={this.props.preview!.target}
        mouseout={this.onMouseOut}
      >
        {this.renderPreview()}
      </Popover>
    );
  }
}

const mapStateToProps = (state: UIState) => ({
  cx: getThreadContext(state),
  sourcesById: getSourceDetailsEntities(state),
});

const mapDispatchToProps = {
  selectSourceURL,
  openLink,
  openElementInInspector: openNodeInInspector,
  highlightDomElement,
  unHighlightDomElement,
  clearPreview,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Popup);

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";

import type { UIState } from "ui/state";
import type { PreviewState } from "devtools/client/debugger/src/reducers/preview";

import {
  highlightDomElement,
  unHighlightDomElement,
  openLink,
  openNodeInInspector,
} from "devtools/client/webconsole/actions/toolbox";
import { selectSourceURL } from "devtools/client/debugger/src/actions/sources/select";
import { clearPreview } from "devtools/client/debugger/src/actions/preview";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import { getSourceDetailsEntities } from "ui/reducers/sources";

import Popover from "../../shared/Popover";

import NewObjectInspector from "./NewObjectInspector";

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
        <NewObjectInspector />
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

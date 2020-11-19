/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { PureComponent } from "react";
import { connect } from "../../../utils/connect";
import actions from "../../../actions";
import { getTruncatedFileName, getSourceQueryString, getFileURL } from "../../../utils/source";
import { getHasSiblingOfSameName, getContext } from "../../../selectors";
import { features } from "../../../utils/prefs";
import { getThreadExecutionPoint } from "../../../reducers/pause";
import { selectors } from "../../../../../../../ui/reducers";
const { getAnalysisPointsForLocation } = selectors;

import { CloseButton } from "../../shared/Button";

class BreakpointHeading extends PureComponent {
  onContextMenu = e => {
    return;
  };

  getLabel() {
    const { breakpoint, source, hasSiblingOfSameName } = this.props;
    const { column, line } = breakpoint.location;

    const columnVal = features.columnBreakpoints && column ? `:${column}` : "";
    const location = `:${line}${columnVal}`;

    const query = hasSiblingOfSameName ? getSourceQueryString(source) : "";
    const fileName = getTruncatedFileName(source, query);

    return `${fileName}${location}`;
  }

  removeBreakpoint = event => {
    const { cx, removeBreakpoint, breakpoint } = this.props;
    event.stopPropagation();
    removeBreakpoint(cx, breakpoint);
  };

  render() {
    const { source } = this.props;

    return (
      <div
        className="breakpoint-heading"
        title={getFileURL(source, false)}
        onContextMenu={this.onContextMenu}
      >
        <div className="breakpoint-heading-label">
          <div>{this.getLabel()}</div>
        </div>
        <div className="breakpoint-heading-actions">
          <CloseButton handleClick={e => this.removeBreakpoint(e)} tooltip={"Remove breakpoint"} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, { source, breakpoint }) => ({
  cx: getContext(state),
  hasSiblingOfSameName: getHasSiblingOfSameName(state, source),
  executionPoint: getThreadExecutionPoint(state),
  analysisPoints: getAnalysisPointsForLocation(state, breakpoint.location),
});

export default connect(mapStateToProps, {
  removeBreakpoint: actions.removeBreakpoint,
})(BreakpointHeading);

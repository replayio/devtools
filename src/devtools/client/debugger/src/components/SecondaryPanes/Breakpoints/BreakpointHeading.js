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
import { getExecutionPoint } from "../../../reducers/pause";
import { CloseButton } from "../../shared/Button";
import { Redacted } from "ui/components/Redacted";

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
    const { cx, source, removeBreakpointsInSource } = this.props;
    event.stopPropagation();

    removeBreakpointsInSource(cx, source);
  };

  onClick = () => {
    const { cx, source, selectSource } = this.props;

    selectSource(cx, source.id);
  };

  render() {
    const { source, hasSiblingOfSameName } = this.props;

    const query = hasSiblingOfSameName ? getSourceQueryString(source) : "";
    const fileName = getTruncatedFileName(source, query);

    return (
      <div
        className="breakpoint-heading"
        title={getFileURL(source, false)}
        onContextMenu={this.onContextMenu}
        onClick={this.onClick}
      >
        <Redacted className="breakpoint-heading-label">{fileName}</Redacted>
        <div className="breakpoint-heading-actions">
          <CloseButton
            handleClick={e => this.removeBreakpoint(e)}
            tooltip={"Remove all breakpoint from this source"}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, { source, breakpoint }) => ({
  cx: getContext(state),
  hasSiblingOfSameName: getHasSiblingOfSameName(state, source),
  executionPoint: getExecutionPoint(state),
});

export default connect(mapStateToProps, {
  selectSource: actions.selectSource,
  removeBreakpointsInSource: actions.removeBreakpointsInSource,
})(BreakpointHeading);

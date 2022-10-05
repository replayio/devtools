import React, { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";

import type { UIState } from "ui/state";
import actions from "../../../actions";
import { getTruncatedFileName, getSourceQueryString, getFileURL } from "../../../utils/source";
import { getContext } from "../../../selectors";
import { features } from "../../../utils/prefs";
import { getExecutionPoint } from "../../../reducers/pause";
import { CloseButton } from "../../shared/Button";
import { Redacted } from "ui/components/Redacted";
import { getHasSiblingOfSameName, MiniSource, getSourceDetails } from "ui/reducers/sources";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { Point } from "shared/client/types";
import { SourceId } from "@replayio/protocol";

type BHExtraProps = {
  sourceId: SourceId;
  breakpoint: Point;
  onRemoveBreakpoints: (cx: Context, source: MiniSource) => void;
};

const mapStateToProps = (state: UIState, { sourceId }: BHExtraProps) => {
  const source = getSourceDetails(state, sourceId)!;
  return {
    cx: getContext(state),
    executionPoint: getExecutionPoint(state),
    hasSiblingOfSameName: getHasSiblingOfSameName(state, source),
    source,
  };
};

const connector = connect(mapStateToProps, {
  selectSource: actions.selectSource,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type BreakpointsProps = PropsFromRedux & BHExtraProps;

class BreakpointHeading extends PureComponent<BreakpointsProps> {
  onContextMenu = () => {
    return;
  };

  getLabel() {
    const { breakpoint, source, hasSiblingOfSameName } = this.props;
    const { column, line } = breakpoint?.location ?? {};

    const columnVal = features.columnBreakpoints && column ? `:${column}` : "";
    const location = `:${line}${columnVal}`;

    const query = hasSiblingOfSameName ? getSourceQueryString(source) : "";
    const fileName = getTruncatedFileName(source, query);

    return `${fileName}${location}`;
  }

  removeBreakpoint = (event: React.MouseEvent) => {
    const { cx, source, onRemoveBreakpoints } = this.props;
    event.stopPropagation();

    onRemoveBreakpoints(cx, source);
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
            buttonClass={null}
            handleClick={this.removeBreakpoint}
            tooltip={"Remove all breakpoint from this source"}
          />
        </div>
      </div>
    );
  }
}

export default connector(BreakpointHeading);

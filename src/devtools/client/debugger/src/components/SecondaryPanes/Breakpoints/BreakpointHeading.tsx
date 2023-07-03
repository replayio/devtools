import { SourceId } from "@replayio/protocol";
import React, { PureComponent } from "react";
import { ConnectedProps, connect } from "react-redux";

import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { Point } from "shared/client/types";
import { userData } from "shared/user-data/GraphQL/UserData";
import { Redacted } from "ui/components/Redacted";
import { MiniSource, getHasSiblingOfSameName, getSourceDetails } from "ui/reducers/sources";
import type { UIState } from "ui/state";

import actions from "../../../actions";
import { getExecutionPoint } from "../../../reducers/pause";
import { getContext } from "../../../selectors";
import { getFileURL, getSourceQueryString, getTruncatedFileName } from "../../../utils/source";
import { CloseButton } from "../../shared/Button";
import styles from "./BreakpointHeading.module.css";

type BHExtraProps = {
  breakpoint: Point;
  allBreakpointsAreShared: boolean;
  onRemoveBreakpoints: (cx: Context, source: MiniSource) => void;
  sourceId: SourceId;
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

    const columnVal =
      userData.get("feature_columnBreakpoints") && column != null ? `:${column}` : "";
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
    const { allBreakpointsAreShared, source, hasSiblingOfSameName } = this.props;

    const query = hasSiblingOfSameName ? getSourceQueryString(source) : "";
    const fileName = getTruncatedFileName(source, query);

    return (
      <div
        className={styles.Heading}
        title={getFileURL(source, false)}
        onContextMenu={this.onContextMenu}
        onClick={this.onClick}
      >
        <Redacted className={styles.Label}>{fileName}</Redacted>
        {allBreakpointsAreShared || (
          <CloseButton
            handleClick={this.removeBreakpoint}
            tooltip={"Remove all breakpoint from this source"}
          />
        )}
      </div>
    );
  }
}

export default connector(BreakpointHeading);

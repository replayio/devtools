import { SourceId } from "@replayio/protocol";
import React, { PureComponent } from "react";
import { ConnectedProps, connect } from "react-redux";

import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { Point } from "shared/client/types";
import { MiniSource, getSourceDetails } from "ui/reducers/sources";
import type { UIState } from "ui/state";

import actions from "../../../actions";
import { getExecutionPoint } from "../../../reducers/pause";
import { getContext } from "../../../selectors";
import { getFileURL, getSourceQueryString, getTruncatedFileName } from "../../../utils/source";
import { CloseButton } from "../../shared/Button";
import styles from "./LogpointHeading.module.css";

type BHExtraProps = {
  logPoint: Point;
  allLogPointsAreShared: boolean;
  onRemoveLogPoints: (cx: Context, source: MiniSource) => void;
  sourceId: SourceId;
};

const mapStateToProps = (state: UIState, { sourceId }: BHExtraProps) => {
  const source = getSourceDetails(state, sourceId)!;
  return {
    cx: getContext(state),
    executionPoint: getExecutionPoint(state),
    source,
  };
};

const connector = connect(mapStateToProps, {
  selectSource: actions.selectSource,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type LogPointsProps = PropsFromRedux & BHExtraProps;

class LogpointHeading extends PureComponent<LogPointsProps> {
  onContextMenu = () => {
    return;
  };

  getLabel() {
    const { logPoint, source } = this.props;
    const { column, line } = logPoint?.location ?? {};

    const columnVal = column != null ? `:${column}` : "";
    const location = `:${line}${columnVal}`;

    const query = getSourceQueryString(source);
    const fileName = getTruncatedFileName(source, query);

    return `${fileName}${location}`;
  }

  removeLogPoint = (event: React.MouseEvent) => {
    const { cx, source, onRemoveLogPoints } = this.props;
    event.stopPropagation();

    onRemoveLogPoints(cx, source);
  };

  onClick = () => {
    const { cx, source, selectSource } = this.props;

    selectSource(cx, source.id);
  };

  render() {
    const { allLogPointsAreShared, source } = this.props;

    const query = getSourceQueryString(source);
    const fileName = getTruncatedFileName(source, query);

    return (
      <div
        className={styles.Heading}
        title={getFileURL(source, false)}
        onContextMenu={this.onContextMenu}
        onClick={this.onClick}
      >
        <div className={styles.Label}>{fileName}</div>
        {allLogPointsAreShared || (
          <CloseButton
            handleClick={this.removeLogPoint}
            tooltip={"Remove all logpoints from this source"}
          />
        )}
      </div>
    );
  }
}

export default connector(LogpointHeading);

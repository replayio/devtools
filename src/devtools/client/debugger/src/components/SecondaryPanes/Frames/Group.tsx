/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import classNames from "classnames";
//
import React, { Component } from "react";

import type { PauseFrame } from "devtools/client/debugger/src/reducers/pause";

import { getLibraryFromUrl } from "../../../utils/pause/frames";
import AccessibleImage from "../../shared/AccessibleImage";
import Badge from "../../shared/Badge";
import FrameComponent from "./Frame";
import FrameIndent from "./FrameIndent";
import FrameMenu from "./FrameMenu";
import type { CommonFrameComponentProps } from "./index";

function FrameLocation({ frame, expanded }: { frame: PauseFrame; expanded: boolean }) {
  const library = frame.library || getLibraryFromUrl(frame);
  if (!library) {
    return null;
  }

  const arrowClassName = classNames("arrow", { expanded });
  return (
    <span className="group-description">
      <AccessibleImage className={arrowClassName} />
      <AccessibleImage className={`annotation-logo ${library.toLowerCase()}`} />
      <span className="group-description-name">{library}</span>
    </span>
  );
}

type GroupProps = CommonFrameComponentProps & {
  group: PauseFrame[];
};

interface GroupState {
  expanded: boolean;
}

export default class Group extends Component<GroupProps, GroupState> {
  state = { expanded: false };

  get isSelectable() {
    return this.props.panel == "console";
  }

  onContextMenu(event: React.MouseEvent) {
    const { group, copyStackTrace, toggleFrameworkGrouping, frameworkGroupingOn, cx } = this.props;
    const frame = group[0];
    FrameMenu(frame, frameworkGroupingOn, { copyStackTrace, toggleFrameworkGrouping }, event);
  }

  toggleFrames = (event: React.MouseEvent) => {
    event.stopPropagation();
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  };

  renderFrames() {
    const {
      cx,
      group,
      selectFrame,
      selectedFrameId,
      toggleFrameworkGrouping,
      frameworkGroupingOn,
      copyStackTrace,
      displayFullUrl,
      disableContextMenu,
      panel,
    } = this.props;

    const { expanded } = this.state;
    if (!expanded) {
      return null;
    }

    return (
      <div className="frames-list">
        {group.reduce((acc, frame, i) => {
          if (this.isSelectable) {
            acc.push(<FrameIndent key={`frame-indent-${i}`} />);
          }
          const commonProps: CommonFrameComponentProps = {
            cx,
            toggleFrameworkGrouping,
            frameworkGroupingOn,
            selectFrame,
            selectedFrameId,
            displayFullUrl,
            disableContextMenu,
            copyStackTrace,
            panel,
          };
          return acc.concat(
            <FrameComponent
              {...commonProps}
              frame={frame}
              key={frame.id}
              shouldMapDisplayName={false}
              displayFullUrl={displayFullUrl}
            />
          );
        }, [] as JSX.Element[])}
      </div>
    );
  }

  renderDescription() {
    const { group } = this.props;

    const frame = group[0];
    const expanded = this.state.expanded;
    const title = this.state.expanded
      ? `Collapse ${frame.library} frames`
      : `Expand ${frame.library} frames`;

    return (
      <div
        role="listitem"
        key={frame.id}
        className={classNames("group")}
        onClick={this.toggleFrames}
        tabIndex={0}
        title={title}
      >
        {this.isSelectable && <FrameIndent />}
        <FrameLocation frame={frame} expanded={expanded} />
        {this.isSelectable && <span className="clipboard-only"> </span>}
        <Badge>{this.props.group.length}</Badge>
        {this.isSelectable && <br className="clipboard-only" />}
      </div>
    );
  }

  render() {
    const { expanded } = this.state;
    const { disableContextMenu } = this.props;
    return (
      <div
        className={classNames("frames-group", { expanded })}
        onContextMenu={disableContextMenu ? undefined : e => this.onContextMenu(e)}
      >
        {this.renderDescription()}
        {this.renderFrames()}
      </div>
    );
  }
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import classNames from "classnames";
import React, { Component } from "react";

import actions from "../../../actions";
import { getLibraryFromUrl } from "../../../utils/pause/frames";
import AccessibleImage from "../../shared/AccessibleImage";
import Badge from "../../shared/Badge";

import FrameComponent from "./Frame";
import FrameIndent from "./FrameIndent";
import FrameMenu from "./FrameMenu";

function FrameLocation({ frame, expanded }) {
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

FrameLocation.displayName = "FrameLocation";

export default class Group extends Component {
  toggleFrames;

  constructor(...args) {
    super(...args);
    this.state = { expanded: false };
  }

  get isSelectable() {
    return this.props.panel == "console";
  }

  onContextMenu(event) {
    const {
      group,
      copyStackTrace,
      toggleFrameworkGrouping,
      toggleBlackBox,
      frameworkGroupingOn,
      cx,
    } = this.props;
    const frame = group[0];
    FrameMenu(
      frame,
      frameworkGroupingOn,
      { copyStackTrace, toggleBlackBox, toggleFrameworkGrouping },
      event,
      cx
    );
  }

  toggleFrames = event => {
    event.stopPropagation();
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  };

  renderFrames() {
    const {
      cx,
      group,
      selectFrame,
      selectLocation,
      selectedFrame,
      toggleFrameworkGrouping,
      frameworkGroupingOn,
      toggleBlackBox,
      copyStackTrace,
      displayFullUrl,
      getFrameTitle,
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
          return acc.concat(
            <FrameComponent
              cx={cx}
              copyStackTrace={copyStackTrace}
              frame={frame}
              frameworkGroupingOn={frameworkGroupingOn}
              hideLocation={true}
              key={frame.id}
              selectedFrame={selectedFrame}
              selectFrame={selectFrame}
              selectLocation={selectLocation}
              shouldMapDisplayName={false}
              toggleBlackBox={toggleBlackBox}
              toggleFrameworkGrouping={toggleFrameworkGrouping}
              displayFullUrl={displayFullUrl}
              getFrameTitle={getFrameTitle}
              disableContextMenu={disableContextMenu}
              panel={panel}
            />
          );
        }, [])}
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
        onContextMenu={disableContextMenu ? null : e => this.onContextMenu(e)}
      >
        {this.renderDescription()}
        {this.renderFrames()}
      </div>
    );
  }
}

Group.displayName = "Group";

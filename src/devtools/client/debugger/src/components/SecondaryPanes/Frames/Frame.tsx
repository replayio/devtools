/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import classNames from "classnames";
//
import React, { Component } from "react";

import type { PauseFrame } from "devtools/client/debugger/src/reducers/pause";
import { Redacted } from "ui/components/Redacted";
import { trackEvent } from "ui/utils/telemetry";

import { formatDisplayName } from "../../../utils/pause/frames";
import { getFileURL, getFilename } from "../../../utils/source";
import AccessibleImage from "../../shared/AccessibleImage";
import FrameIndent from "./FrameIndent";
import FrameMenu from "./FrameMenu";
import type { CommonFrameComponentProps } from "./index";

type FrameNameOptions = Parameters<typeof formatDisplayName>[1];

function FrameTitle({ frame, options = {} }: { frame: PauseFrame; options: FrameNameOptions }) {
  const displayName = formatDisplayName(frame, options);
  return <span className="title">{displayName}</span>;
}

function FrameLocation({
  frame,
  displayFullUrl = false,
}: {
  frame: PauseFrame;
  displayFullUrl?: boolean;
}) {
  if (!frame.source) {
    return null;
  }

  if (frame.library) {
    return (
      <span className="location">
        {frame.library}
        <AccessibleImage className={`annotation-logo ${frame.library.toLowerCase()}`} />
      </span>
    );
  }

  const { location, source } = frame;
  const filename = displayFullUrl ? getFileURL(source, false) : getFilename(source);

  return (
    <span className="location frame-link-source" title={source.url}>
      <span className="filename">{filename}</span>:
      <span className="line frame-link-line">{location.line}</span>
    </span>
  );
}

FrameLocation.displayName = "FrameLocation";

type FrameProps = CommonFrameComponentProps & {
  frame: PauseFrame;
  hideLocation: boolean;
  shouldMapDisplayName: boolean;
  getFrameTitle?: (url: string) => string;
};

export default class FrameComponent extends Component<FrameProps> {
  static defaultProps = {
    hideLocation: false,
    shouldMapDisplayName: true,
    disableContextMenu: false,
  };

  get isSelectable() {
    return this.props.panel == "console";
  }

  get isDebugger() {
    return this.props.panel == "debugger";
  }

  onContextMenu(event: React.MouseEvent) {
    const { frame, copyStackTrace, toggleFrameworkGrouping, frameworkGroupingOn, cx } = this.props;
    FrameMenu(frame, frameworkGroupingOn, { copyStackTrace, toggleFrameworkGrouping }, event);
  }

  onMouseDown(e: React.MouseEvent, frame: PauseFrame) {
    if (e.button !== 0) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    trackEvent("call_stack.select_frame");
    this.props.selectFrame(this.props.cx, frame);
  }

  onKeyUp(event: React.KeyboardEvent, frame: PauseFrame) {
    if (event.key != "Enter") {
      return;
    }

    this.props.selectFrame(this.props.cx, frame);
  }

  render() {
    const {
      frame,
      selectedFrameId,
      hideLocation,
      shouldMapDisplayName,
      displayFullUrl,
      getFrameTitle,
      disableContextMenu,
      panel,
    } = this.props;

    const className = classNames("frame", {
      selected:
        selectedFrameId?.pauseId === frame.pauseId && selectedFrameId?.frameId === frame.protocolId,
    });

    if (!frame.source) {
      throw new Error("no frame source");
    }

    const title = getFrameTitle
      ? getFrameTitle(`${getFileURL(frame.source, false)}:${frame.location.line}`)
      : undefined;

    return (
      <Redacted
        role="listitem"
        key={frame.id}
        className={className}
        onMouseDown={e => this.onMouseDown(e, frame)}
        onKeyUp={e => this.onKeyUp(e, frame)}
        onContextMenu={disableContextMenu ? undefined : e => this.onContextMenu(e)}
        tabIndex={0}
        title={title}
      >
        {this.isSelectable && <FrameIndent />}
        <div
          className={classNames("frame-description", panel === "webconsole" ? "frame-link" : "")}
        >
          <FrameTitle frame={frame} options={{ shouldMapDisplayName }} />
          {!hideLocation && <span className="clipboard-only"> </span>}
          {!hideLocation && <FrameLocation frame={frame} displayFullUrl={displayFullUrl} />}
          {this.isSelectable && <br className="clipboard-only" />}
        </div>
      </Redacted>
    );
  }
}

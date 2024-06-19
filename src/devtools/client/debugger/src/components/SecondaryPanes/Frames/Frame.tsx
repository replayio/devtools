/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import classNames from "classnames";
import React from "react";

import type { PauseFrame } from "devtools/client/debugger/src/reducers/pause";
import { trackEvent } from "ui/utils/telemetry";

import { formatDisplayName } from "../../../utils/pause/frames";
import { getFileURL, getFilename } from "../../../utils/source";
import AccessibleImage from "../../shared/AccessibleImage";
import FrameIndent from "./FrameIndent";
import type { CommonFrameComponentProps } from "./index";
import { useStackFrameContextMenu } from "./useStackFrameContextMenu";

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
  hideLocation?: boolean;
  shouldMapDisplayName?: boolean;
  getFrameTitle?: (url: string) => string;
};

export function FrameComponent({
  hideLocation = false,
  shouldMapDisplayName = true,
  disableContextMenu = true,
  panel,
  frame,
  selectedFrameId,
  displayFullUrl,
  getFrameTitle,
  selectFrame,
  copyStackTrace,
  toggleFrameworkGrouping,
  frameworkGroupingOn,
  cx,
}: FrameProps) {
  const isSelectable = panel === "console";

  const { contextMenu, onContextMenu } = useStackFrameContextMenu({
    frame,
    frameworkGroupingOn,
    copyStackTrace,
    toggleFrameworkGrouping,
  });

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    trackEvent("call_stack.select_frame");
    selectFrame(cx, frame);
  };

  const onKeyUp = (event: React.KeyboardEvent) => {
    if (event.key != "Enter") {
      return;
    }

    selectFrame(cx, frame);
  };

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
    <>
      <div
        role="listitem"
        key={frame.id}
        className={className}
        onMouseDown={onMouseDown}
        onKeyUp={onKeyUp}
        onContextMenu={disableContextMenu ? undefined : e => onContextMenu(e)}
        tabIndex={0}
        title={title}
      >
        {isSelectable && <FrameIndent />}
        <div
          className={classNames("frame-description", panel === "webconsole" ? "frame-link" : "")}
        >
          <FrameTitle frame={frame} options={{ shouldMapDisplayName }} />
          {!hideLocation && <span className="clipboard-only"> </span>}
          {!hideLocation && <FrameLocation frame={frame} displayFullUrl={displayFullUrl} />}
          {isSelectable && <br className="clipboard-only" />}
        </div>
      </div>

      {/*Keep the context menu separate to avoid `onMouseDown`
      bubbling up and causing unwanted frame selection behavior*/}
      {contextMenu}
    </>
  );
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import classNames from "classnames";
import React, { useState } from "react";

import type { PauseFrame } from "devtools/client/debugger/src/reducers/pause";

import { getLibraryFromUrl } from "../../../utils/pause/frames";
import AccessibleImage from "../../shared/AccessibleImage";
import Badge from "../../shared/Badge";
import { FrameComponent } from "./Frame";
import FrameIndent from "./FrameIndent";
import type { CommonFrameComponentProps } from "./index";
import { useStackFrameContextMenu } from "./useStackFrameContextMenu";

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

export function Group({
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
}: GroupProps) {
  const isSelectable = panel == "console";

  const { contextMenu, onContextMenu } = useStackFrameContextMenu({
    frameworkGroupingOn,
    toggleFrameworkGrouping,
    copyStackTrace,
  });

  const containsSelectedFrame = group.some(
    frame =>
      selectedFrameId?.pauseId === frame.pauseId && selectedFrameId?.frameId === frame.protocolId
  );
  const [expanded, setExpanded] = useState(containsSelectedFrame);
  const toggleFrames = (event: React.MouseEvent) => {
    event.stopPropagation();
    setExpanded(prevExpanded => !prevExpanded);
  };

  const frame = group[0];
  const title = expanded ? `Collapse ${frame.library} frames` : `Expand ${frame.library} frames`;

  const description = (
    <div
      role="listitem"
      key={frame.id}
      className={classNames("group")}
      onClick={toggleFrames}
      tabIndex={0}
      title={title}
    >
      {isSelectable && <FrameIndent />}
      <FrameLocation frame={frame} expanded={expanded} />
      {isSelectable && <span className="clipboard-only"> </span>}
      <Badge>{group.length}</Badge>
      {isSelectable && <br className="clipboard-only" />}
    </div>
  );

  let frames: React.ReactNode = null;

  if (expanded) {
    frames = (
      <div className="frames-list">
        {group.reduce((acc, frame, i) => {
          if (isSelectable) {
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

  return (
    <>
      <div
        className={classNames("frames-group", { expanded })}
        onContextMenu={disableContextMenu ? undefined : onContextMenu}
      >
        {description}
        {frames}
      </div>
      {contextMenu}
    </>
  );
}

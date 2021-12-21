/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import classnames from "classnames";
import { connect } from "../../utils/connect";

import {
  getTopFrame,
  getBreakpointsList,
  getBreakpointsDisabled,
  getIsWaitingOnBreak,
  getPauseCommand,
  getSelectedFrame,
  getThreadContext,
  getSourceFromId,
  getFramesLoading,
} from "../../selectors";

import AccessibleImage from "../shared/AccessibleImage";
import { prefs } from "../../utils/prefs";

import PrintStatements from "./PrintStatements";
import BreakpointsPane from "./BreakpointsPane";
import Frames from "./Frames";
import Accordion from "../shared/Accordion";
import CommandBar from "./CommandBar";
import FrameTimeline from "./FrameTimeline";

import Scopes from "./Scopes";

function debugBtn(onClick, type, className, tooltip) {
  return (
    <button onClick={onClick} className={`${type} ${className}`} key={type} title={tooltip}>
      <AccessibleImage className={type} title={tooltip} aria-label={tooltip} />
    </button>
  );
}

const mdnLink =
  "https://developer.mozilla.org/docs/Tools/Debugger/Using_the_Debugger_map_scopes_feature?utm_source=devtools&utm_medium=debugger-map-scopes";

class SecondaryPanes extends Component {
  getScopeItem() {
    return {
      header: "Scopes",
      className: "scopes-pane",
      component: <Scopes />,
      opened: prefs.scopesVisible,
      onToggle: opened => {
        prefs.scopesVisible = opened;
      },
    };
  }

  getCallStackItem() {
    return {
      header: "Call stack",
      className: "call-stack-pane",
      component: <Frames panel="debugger" />,
      opened: prefs.callStackVisible,
      onToggle: opened => {
        prefs.callStackVisible = opened;
      },
    };
  }

  getPrintStatementItems() {
    return {
      header: "Print Statements",
      className: "breakpoints-pane",
      component: <PrintStatements />,
      opened: prefs.breakpointsVisible,
      onToggle: opened => {
        prefs.breakpointsVisible = opened;
      },
    };
  }

  getBreakpointItems() {
    return {
      header: "Breakpoints",
      className: "breakpoints-pane",
      component: <BreakpointsPane />,
      opened: prefs.breakpointsVisible,
      onToggle: opened => {
        prefs.breakpointsVisible = opened;
      },
    };
  }

  getStartItems() {
    const items = [];
    const { horizontal, hasFrames, framesLoading } = this.props;

    items.push(this.getBreakpointItems(), this.getPrintStatementItems());

    if (hasFrames) {
      items.push(this.getCallStackItem());
      if (horizontal) {
        items.push(this.getScopeItem());
      }
    } else if (framesLoading) {
      items.push(this.getCallStackItem());
    }

    return items;
  }

  getEndItems() {
    if (this.props.horizontal) {
      return [];
    }

    const items = [];

    if (this.props.hasFrames) {
      items.push(this.getScopeItem());
    }

    return items;
  }

  getItems() {
    return [...this.getStartItems(), ...this.getEndItems()];
  }

  render() {
    return (
      <div className="secondary-panes-wrapper">
        <CommandBar horizontal={this.props.horizontal} />
        <FrameTimeline />
        <div className={classnames("secondary-panes")}>
          <Accordion items={this.getItems()} />
        </div>
      </div>
    );
  }
}

// Checks if user is in debugging mode and adds a delay preventing
// excessive vertical 'jumpiness'
function getRenderWhyPauseDelay(state, thread) {
  const inPauseCommand = !!getPauseCommand(state, thread);

  if (!inPauseCommand) {
    return 100;
  }

  return 0;
}

const mapStateToProps = state => {
  const selectedFrame = getSelectedFrame(state);

  return {
    cx: getThreadContext(state),
    hasFrames: !!getTopFrame(state),
    framesLoading: getFramesLoading(state),
    breakpoints: getBreakpointsList(state),
    breakpointsDisabled: getBreakpointsDisabled(state),
    isWaitingOnBreak: getIsWaitingOnBreak(state),
    renderWhyPauseDelay: getRenderWhyPauseDelay(state),
    selectedFrame,
    source: selectedFrame && getSourceFromId(state, selectedFrame.location.sourceId),
  };
};

export default connect(mapStateToProps)(SecondaryPanes);

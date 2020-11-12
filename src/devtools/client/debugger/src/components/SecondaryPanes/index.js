/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import classnames from "classnames";
import { connect } from "../../utils/connect";

import actions from "../../actions";
import {
  getTopFrame,
  getBreakpointsList,
  getBreakpointsDisabled,
  getIsWaitingOnBreak,
  getPauseCommand,
  getSelectedFrame,
  getShouldLogExceptions,
  getThreadContext,
  getSourceFromId,
  getFramesLoading,
} from "../../selectors";

import AccessibleImage from "../shared/AccessibleImage";
import { prefs, features } from "../../utils/prefs";

import Breakpoints from "./Breakpoints";
import SplitBox from "devtools-splitter";
import Frames from "./Frames";
import Accordion from "../shared/Accordion";
import CommandBar from "./CommandBar";
import WhyPaused from "./WhyPaused";
import FrameTimeline from "./FrameTimeline";

import Scopes from "./Scopes";

import "./SecondaryPanes.css";

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
      header: L10N.getStr("scopes.header"),
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
      header: L10N.getStr("callStack.header"),
      className: "call-stack-pane",
      component: <Frames panel="debugger" />,
      opened: prefs.callStackVisible,
      onToggle: opened => {
        prefs.callStackVisible = opened;
      },
    };
  }

  getBreakpointsItem() {
    const { shouldLogExceptions, logExceptions } = this.props;

    return {
      header: L10N.getStr("breakpoints.header"),
      className: "breakpoints-pane",
      component: (
        <Breakpoints shouldLogExceptions={shouldLogExceptions} logExceptions={logExceptions} />
      ),
      opened: prefs.breakpointsVisible,
      onToggle: opened => {
        prefs.breakpointsVisible = opened;
      },
    };
  }

  getStartItems() {
    const items = [];
    const { horizontal, hasFrames, framesLoading } = this.props;

    items.push(this.getBreakpointsItem());

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

  renderHorizontalLayout() {
    const { renderWhyPauseDelay } = this.props;

    return (
      <div>
        <WhyPaused delay={renderWhyPauseDelay} />
        <Accordion items={this.getItems()} />
      </div>
    );
  }

  renderVerticalLayout() {
    return (
      <SplitBox
        initialSize="300px"
        minSize={10}
        maxSize="50%"
        splitterSize={1}
        startPanel={
          <div style={{ width: "inherit" }}>
            <WhyPaused delay={this.props.renderWhyPauseDelay} />
            <Accordion items={this.getStartItems()} />
          </div>
        }
        endPanel={<Accordion items={this.getEndItems()} />}
      />
    );
  }

  render() {
    return (
      <div className="secondary-panes-wrapper">
        <CommandBar horizontal={this.props.horizontal} />
        <FrameTimeline />
        <div className={classnames("secondary-panes")}>
          {this.props.horizontal ? this.renderHorizontalLayout() : this.renderVerticalLayout()}
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
    shouldLogExceptions: getShouldLogExceptions(state),
    source: selectedFrame && getSourceFromId(state, selectedFrame.location.sourceId),
  };
};

export default connect(mapStateToProps)(SecondaryPanes);

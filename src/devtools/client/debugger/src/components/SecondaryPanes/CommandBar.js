/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import PropTypes from "prop-types";
import React, { Component } from "react";

import { connect } from "../../utils/connect";
import {
  getIsWaitingOnBreak,
  getThreadContext,
  getBreakpointSources,
  getFramePositions,
  hasFrames,
} from "../../selectors";
import { formatKeyShortcut } from "../../utils/text";
import actions from "../../actions";
import CommandBarButton from "../shared/Button/CommandBarButton";
import { trackEvent } from "ui/utils/telemetry";

import { appinfo } from "devtools/shared/services";

const isMacOS = appinfo.OS === "Darwin";

// NOTE: the "resume" command will call either the resume
// depending on whether or not the debugger is paused or running
const COMMANDS = ["resume", "stepOver", "stepIn", "stepOut"];

const KEYS = {
  WINNT: {
    resume: "F8",
    stepOver: "F10",
    stepIn: "F11",
    stepOut: "Shift+F11",
  },
  Darwin: {
    resume: "Cmd+\\",
    stepOver: "Cmd+'",
    stepIn: "Cmd+;",
    stepOut: "Cmd+Shift+:",
    stepOutDisplay: "Cmd+Shift+;",
  },
  Linux: {
    resume: "F8",
    stepOver: "F10",
    stepIn: "F11",
    stepOut: "Shift+F11",
  },
};

function getKey(action) {
  return getKeyForOS(appinfo.OS, action);
}

function getKeyForOS(os, action) {
  const osActions = KEYS[os] || KEYS.Linux;
  return osActions[action];
}

function formatKey(action) {
  const key = getKey(`${action}Display`) || getKey(action);
  if (isMacOS) {
    const winKey = getKeyForOS("WINNT", `${action}Display`) || getKeyForOS("WINNT", action);
    // display both Windows type and Mac specific keys
    return formatKeyShortcut([key, winKey].join(" "));
  }
  return formatKeyShortcut(key);
}

class CommandBar extends Component {
  componentWillUnmount() {
    const shortcuts = this.context.shortcuts;
    COMMANDS.forEach(action => shortcuts.off(getKey(action)));
    if (isMacOS) {
      COMMANDS.forEach(action => shortcuts.off(getKeyForOS("WINNT", action)));
    }
  }

  componentDidMount() {
    const shortcuts = this.context.shortcuts;

    COMMANDS.forEach(action => shortcuts.on(getKey(action), e => this.handleEvent(e, action)));

    if (isMacOS) {
      // The Mac supports both the Windows Function keys
      // as well as the Mac non-Function keys
      COMMANDS.forEach(action =>
        shortcuts.on(getKeyForOS("WINNT", action), e => this.handleEvent(e, action))
      );
    }
  }

  handleEvent(e, action) {
    const { cx } = this.props;
    e.preventDefault();
    e.stopPropagation();
    if (action === "resume") {
      this.props.resume(cx);
    } else {
      this.props[action](cx);
    }
  }

  onRewind = () => {
    const { cx } = this.props;
    trackEvent("debugger.rewind");
    this.props.rewind(cx);
  };
  onResume = () => {
    const { cx } = this.props;
    trackEvent("debugger.resume");
    this.props.resume(cx);
  };
  onReverseStepOver = () => {
    const { cx } = this.props;
    trackEvent("debugger.reverse_step_over");
    this.props.reverseStepOver(cx);
  };
  onStepOver = () => {
    const { cx } = this.props;
    trackEvent("debugger.step_over");
    this.props.stepOver(cx);
  };
  onStepIn = () => {
    const { cx } = this.props;
    trackEvent("debugger.step_in");
    this.props.stepIn(cx);
  };
  onStepOut = () => {
    const { cx } = this.props;
    trackEvent("debugger.step_out");
    this.props.stepOut(cx);
  };

  resume() {
    this.props.resume(this.props.cx);
  }

  renderRewindButton() {
    const { hasBreakpoints } = this.props;
    const disabled = !hasBreakpoints;

    const disabledTooltip = "Rewinding is disabled until you add a breakpoint";
    const tooltip = "Rewind Execution";

    return (
      <CommandBarButton
        disabled={disabled}
        key="rewind"
        onClick={this.onRewind}
        tooltip={tooltip}
        disabledTooltip={disabledTooltip}
        type="rewind"
      />
    );
  }
  renderResumeButton() {
    const { hasBreakpoints } = this.props;
    const disabled = !hasBreakpoints;

    const disabledTooltip = "Resuming is disabled until you add a breakpoint";
    const tooltip = L10N.getFormatStr("resumeButtonTooltip", formatKey("resume"));

    return (
      <CommandBarButton
        disabled={disabled}
        key="resume"
        onClick={this.onResume}
        tooltip={tooltip}
        disabledTooltip={disabledTooltip}
        type="resume"
      />
    );
  }

  renderStepButtons() {
    const { isPaused, hasFramePositions } = this.props;
    const disabled = !isPaused || !hasFramePositions;
    const disabledTooltip = !isPaused
      ? "Stepping is disabled until you're paused at a point"
      : "Stepping is disabled because there are too many steps in the current frame";

    return [
      <div key="divider-2" className="divider" />,
      <CommandBarButton
        disabled={disabled}
        key="reverseStepOver"
        onClick={this.onReverseStepOver}
        tooltip="Reverse Step Over"
        disabledTooltip={disabledTooltip}
        type="reverseStepOver"
      />,
      <CommandBarButton
        disabled={disabled}
        key="stepOver"
        onClick={this.onStepOver}
        tooltip="Step Over"
        disabledTooltip={disabledTooltip}
        type="stepOver"
      />,
      <div key="divider-3" className="divider" />,
      <CommandBarButton
        disabled={disabled}
        key="stepIn"
        onClick={this.onStepIn}
        tooltip="Step In"
        disabledTooltip={disabledTooltip}
        type="stepIn"
      />,
      <CommandBarButton
        disabled={disabled}
        key="stepOut"
        onClick={this.onStepOut}
        tooltip="Step Out"
        disabledTooltip={disabledTooltip}
        type="stepOut"
      />,
    ];
  }

  renderReplayButtons() {
    const { cx } = this.props;

    return [this.renderRewindButton(), this.renderResumeButton(), this.renderStepButtons()];
  }

  render() {
    return <div className="command-bar">{this.renderReplayButtons()}</div>;
  }
}

CommandBar.contextTypes = {
  shortcuts: PropTypes.object,
};

const mapStateToProps = state => ({
  cx: getThreadContext(state),
  hasBreakpoints: getBreakpointSources(state).length,
  hasFramePositions: getFramePositions(state)?.positions.length,
  isPaused: hasFrames(state),
  isWaitingOnBreak: getIsWaitingOnBreak(state),
});

export default connect(mapStateToProps, {
  resume: actions.resume,
  stepIn: actions.stepIn,
  stepOut: actions.stepOut,
  stepOver: actions.stepOver,
  rewind: actions.rewind,
  reverseStepOver: actions.reverseStepOver,
})(CommandBar);

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import PropTypes from "prop-types";
import React, { Component } from "react";

import { connect } from "../../utils/connect";
import classnames from "classnames";
import { getIsWaitingOnBreak, getSkipPausing, getThreadContext } from "../../selectors";
import { formatKeyShortcut } from "../../utils/text";
import actions from "../../actions";
import { debugBtn } from "../shared/Button/CommandBarButton";
import { trackEvent } from "ui/utils/telemetry";
import "./CommandBar.css";

import { appinfo } from "devtools-services";

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

  resume() {
    this.props.resume(this.props.cx);
  }

  renderReplayButtons() {
    const { cx } = this.props;

    const className = cx.isPaused ? "active" : "disabled";

    return [
      debugBtn(
        () => {
          trackEvent("debugger.rewind");
          this.props.rewind(cx);
        },
        "rewind",
        className,
        "Rewind Execution",
        !cx.isPaused
      ),
      debugBtn(
        () => {
          trackEvent("debugger.resume");
          this.props.resume(cx);
        },
        "resume",
        className,
        L10N.getFormatStr("resumeButtonTooltip", formatKey("resume")),
        !cx.isPaused
      ),
      <div key="divider-2" className="divider" />,
      debugBtn(
        () => {
          trackEvent("debugger.reverse_step_over");
          this.props.reverseStepOver(cx);
        },
        "reverseStepOver",
        className,
        "Reverse step over",
        !cx.isPaused
      ),
      debugBtn(
        () => {
          trackEvent("debugger.step_over");
          this.props.stepOver(cx);
        },
        "stepOver",
        className,
        L10N.getFormatStr("stepOverTooltip", formatKey("stepOver")),
        !cx.isPaused
      ),
      <div key="divider-3" className="divider" />,
      debugBtn(
        () => {
          trackEvent("debugger.step_in");
          this.props.stepIn(cx);
        },
        "stepIn",
        className,
        L10N.getFormatStr("stepInTooltip", formatKey("stepIn")),
        !cx.isPaused
      ),
      debugBtn(
        () => {
          trackEvent("debugger.step_out");
          this.props.stepOut(cx);
        },
        "stepOut",
        className,
        L10N.getFormatStr("stepOutTooltip", formatKey("stepOut")),
        !cx.isPaused
      ),
    ];
  }

  render() {
    return (
      <div
        className={classnames("command-bar", {
          vertical: !this.props.horizontal,
        })}
      >
        {this.renderReplayButtons()}
      </div>
    );
  }
}

CommandBar.contextTypes = {
  shortcuts: PropTypes.object,
};

const mapStateToProps = state => ({
  cx: getThreadContext(state),
  isWaitingOnBreak: getIsWaitingOnBreak(state),
  skipPausing: getSkipPausing(state),
});

export default connect(mapStateToProps, {
  resume: actions.resume,
  stepIn: actions.stepIn,
  stepOut: actions.stepOut,
  stepOver: actions.stepOver,
  rewind: actions.rewind,
  reverseStepOver: actions.reverseStepOver,
})(CommandBar);

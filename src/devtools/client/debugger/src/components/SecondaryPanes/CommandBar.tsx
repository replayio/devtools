/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component } from "react";

import { connect, ConnectedProps } from "react-redux";
import { getThreadContext, getFramePositions, hasFrames } from "../../selectors";
import { formatKeyShortcut } from "../../utils/text";
import actions from "../../actions";
import CommandBarButton from "../shared/Button/CommandBarButton";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import { trackEvent } from "ui/utils/telemetry";
import type { UIState } from "ui/state";

import Services from "devtools/shared/services";

const { appinfo } = Services;

const isMacOS = appinfo.OS === "Darwin";

// NOTE: the "resume" command will call either the resume
// depending on whether or not the debugger is paused or running
const COMMANDS = ["resume", "reverseStepOver", "stepOver", "stepIn", "stepOut"] as const;
type PossibleCommands = typeof COMMANDS[number];

const KEYS = {
  WINNT: {
    resume: "F8",
    reverseStepOver: "Shift+F10",
    stepOver: "F10",
    stepIn: "F11",
    stepOut: "Shift+F11",
  },
  Darwin: {
    resume: "Cmd+\\",
    reverseStepOver: "Cmd+Shift+'",
    stepOver: "Cmd+'",
    stepIn: "Cmd+;",
    stepOut: "Cmd+Shift+;",
  },
  Linux: {
    resume: "F8",
    reverseStepOver: "Shift+F10",
    stepOver: "F10",
    stepIn: "F11",
    stepOut: "Shift+F11",
  },
};

function getKey(action: string) {
  // @ts-expect-error could be 'Unknown', whatever
  return getKeyForOS(appinfo.OS, action);
}

function getKeyForOS(os: keyof typeof KEYS, action: string): string {
  const osActions = KEYS[os] || KEYS.Linux;
  // @ts-expect-error whatever
  return osActions[action];
}

function formatKey(action: string) {
  const key = getKey(`${action}Display`) || getKey(action);
  if (isMacOS) {
    const winKey = getKeyForOS("WINNT", `${action}Display`) || getKeyForOS("WINNT", action);
    // display both Windows type and Mac specific keys
    return formatKeyShortcut([key, winKey].join(" "));
  }
  return formatKeyShortcut(key);
}

class CommandBar extends Component<PropsFromRedux> {
  // @ts-expect-error it gets initialized in cDM
  shortcuts: KeyShortcuts | null;

  componentWillUnmount() {
    const shortcuts = this.shortcuts;
    COMMANDS.forEach(action => shortcuts!.off(getKey(action)));
    if (isMacOS) {
      COMMANDS.forEach(action => shortcuts!.off(getKeyForOS("WINNT", action)));
    }
  }

  componentDidMount() {
    this.shortcuts = new KeyShortcuts({
      window,
      target: document.body,
    });
    const shortcuts = this.shortcuts;

    COMMANDS.forEach(action =>
      shortcuts.on(getKey(action), (e: KeyboardEvent) => this.handleEvent(e, action))
    );

    if (isMacOS) {
      // The Mac supports both the Windows Function keys
      // as well as the Mac non-Function keys
      COMMANDS.forEach(action =>
        shortcuts.on(getKeyForOS("WINNT", action), (e: KeyboardEvent) =>
          this.handleEvent(e, action)
        )
      );
    }
  }

  handleEvent(e: KeyboardEvent, action: PossibleCommands) {
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
    return (
      <CommandBarButton
        key="rewind"
        onClick={this.onRewind}
        tooltip="Rewind Execution"
        type="rewind"
      />
    );
  }
  renderResumeButton() {
    return (
      <CommandBarButton
        key="resume"
        onClick={this.onResume}
        tooltip={`Resume ${formatKey("resume")}`}
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

const mapStateToProps = (state: UIState) => ({
  cx: getThreadContext(state),
  hasFramePositions: getFramePositions(state)?.positions.length,
  isPaused: hasFrames(state),
});

const connector = connect(mapStateToProps, {
  resume: actions.resume,
  stepIn: actions.stepIn,
  stepOut: actions.stepOut,
  stepOver: actions.stepOver,
  rewind: actions.rewind,
  reverseStepOver: actions.reverseStepOver,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommandBar);

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { getUserId } = require("ui/hooks/users");
const { withAuth0 } = require("@auth0/auth0-react");
const { withRouter } = require("next/router");
const { Component, createFactory, createElement } = require("react");
const dom = require("react-dom-factories");
const { l10n } = require("devtools/client/webconsole/utils/messages");
const { actions } = require("ui/actions/index");
const { MESSAGE_TYPE } = require("devtools/client/webconsole/constants");
const { MessageIndent } = require("devtools/client/webconsole/components/Output/MessageIndent");
const MessageIcon = require("devtools/client/webconsole/components/Output/MessageIcon");
const FrameView = createFactory(require("devtools/client/shared/components/Frame"));

const CollapseButton = require("devtools/client/webconsole/components/Output/CollapseButton");
const MessageRepeat = require("devtools/client/webconsole/components/Output/MessageRepeat");
const PropTypes = require("prop-types");
const SmartTrace = require("devtools/client/shared/components/SmartTrace");
const { trackEvent } = require("ui/utils/telemetry");
const { dismissNag, Nag } = require("ui/hooks/users");
import { getRecordingId } from "ui/utils/recording";

class Message extends Component {
  static get propTypes() {
    return {
      open: PropTypes.bool,
      collapsible: PropTypes.bool,
      collapseTitle: PropTypes.string,
      onToggle: PropTypes.func,
      source: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      level: PropTypes.string.isRequired,
      indent: PropTypes.number.isRequired,
      topLevelClasses: PropTypes.array.isRequired,
      messageBody: PropTypes.any.isRequired,
      repeat: PropTypes.any,
      frame: PropTypes.any,
      attachment: PropTypes.any,
      stacktrace: PropTypes.any,
      messageId: PropTypes.string,
      executionPoint: PropTypes.string,
      executionPointTime: PropTypes.any,
      executionPointHasFrames: PropTypes.any,
      pausedExecutionPoint: PropTypes.string,
      scrollToMessage: PropTypes.bool,
      exceptionDocURL: PropTypes.string,
      request: PropTypes.object,
      dispatch: PropTypes.func,
      timeStamp: PropTypes.number,
      timestampsVisible: PropTypes.bool,
      notes: PropTypes.arrayOf(
        PropTypes.shape({
          messageBody: PropTypes.string.isRequired,
          frame: PropTypes.any,
        })
      ),
      isPaused: PropTypes.bool,
      maybeScrollToBottom: PropTypes.func,
      message: PropTypes.object.isRequired,
      isPrimaryHighlighted: PropTypes.bool,
      shouldScrollIntoView: PropTypes.bool,
    };
  }

  static get defaultProps() {
    return {
      indent: 0,
    };
  }

  constructor(props) {
    super(props);
    this.onLearnMoreClick = this.onLearnMoreClick.bind(this);
    this.toggleMessage = this.toggleMessage.bind(this);
    this.onMouseEvent = this.onMouseEvent.bind(this);
    this.renderIcon = this.renderIcon.bind(this);
  }

  componentDidMount() {
    if (this.messageNode) {
      if (this.props.scrollToMessage) {
        this.messageNode.scrollIntoView();
      }

      this.emitNewMessage(this.messageNode);
    }
  }

  componentDidCatch(e) {
    this.setState({ error: e });
  }

  componentDidUpdate() {
    if (this.props.shouldScrollIntoView) {
      this.messageNode.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  shouldComponentUpdate(nextProps) {
    return (
      this.props.isPrimaryHighlighted !== nextProps.isPrimaryHighlighted ||
      this.props.pausedExecutionPoint !== nextProps.pausedExecutionPoint ||
      this.props.isPaused !== nextProps.isPaused ||
      this.props.timestampsVisible !== nextProps.timestampsVisible ||
      this.props.open !== nextProps.open
    );
  }

  // Event used in tests. Some message types don't pass it in because existing tests
  // did not emit for them.
  emitNewMessage(node) {}

  onLearnMoreClick(e) {
    const { exceptionDocURL, dispatch } = this.props;
    dispatch(actions.openLink(exceptionDocURL, e));
    e.preventDefault();
  }

  onViewSourceInDebugger = frame => {
    const { dispatch } = this.props;
    trackEvent("console.select_source ");
    dispatch(actions.onViewSourceInDebugger(frame));
  };

  toggleMessage(e) {
    // Don't bubble up to the main App component, which  redirects focus to input,
    // making difficult for screen reader users to review output
    e.stopPropagation();
    const { open, dispatch, messageId, onToggle } = this.props;

    // Early exit the function to avoid the message to collapse if the user is
    // selecting a range in the toggle message.
    const window = e.target.ownerDocument.defaultView;
    if (window.getSelection && window.getSelection().type === "Range") {
      return;
    }

    // If defined on props, we let the onToggle() method handle the toggling,
    // otherwise we toggle the message open/closed ourselves.
    if (onToggle) {
      onToggle(messageId, e);
    } else if (open) {
      dispatch(actions.messageClose(messageId));
    } else {
      dispatch(actions.messageOpen(messageId));
    }
  }

  onMouseEvent(ev) {
    const { dispatch, message, executionPoint } = this.props;
    if (executionPoint) {
      dispatch(actions.onMessageHover(ev.type, message));
    }
  }

  renderOverlayButton() {
    const {
      executionPoint,
      executionPointTime,
      executionPointHasFrames,
      dispatch,
      pausedExecutionPoint = Number.POSITIVE_INFINITY,
      type,
      frame,
      message,
      isFirstMessageForPoint,
    } = this.props;

    if (!pausedExecutionPoint || !executionPoint || !frame) {
      return undefined;
    }

    let overlayType, label;
    let onRewindClick = () => {
      trackEvent("console.seek");
      dispatch(
        actions.seek(executionPoint, executionPointTime, executionPointHasFrames, message.pauseId)
      );

      this.onViewSourceInDebugger({ ...frame, url: frame.source });
      dismissNag(Nag.FIRST_CONSOLE_NAVIGATE);
    };
    let handleAddComment = async () => {
      trackEvent("console.add_comment");
      let userId = await getUserId();
      const opts = {
        position: null,
        hasFrames: true,
        sourceLocation: frame,
      };

      dispatch(
        actions.createComment(
          executionPointTime,
          executionPoint,
          { ...this.props.auth0.user, id: userId },
          getRecordingId(this.props.router.query.id),
          opts
        )
      );
    };

    if (BigInt(executionPoint) > BigInt(pausedExecutionPoint)) {
      overlayType = "fast-forward";
      label = "Fast-forward";
    } else if (BigInt(executionPoint) < BigInt(pausedExecutionPoint)) {
      overlayType = "rewind";
      label = "Rewind";
    } else if (!isFirstMessageForPoint) {
      // Handle cases where executionPoint is the same as pauseExecutionPoint.
      return;
    } else if (!["command", "result"].includes(type)) {
      overlayType = "debug";
      label = "Debug";

      return dom.div(
        { className: `overlay-container debug`, title: "Add Comment", onClick: handleAddComment },
        dom.div({ className: "info" }, dom.div({ className: "label" }, "Comment")),
        dom.div(
          { className: "button" },
          dom.div(
            {
              className: "material-icons text-base text-white add-comment-icon",
              style: { fontSize: "16px" },
            },
            "add_comment"
          )
        )
      );
    }

    return dom.div(
      { className: `overlay-container ${overlayType}`, onClick: onRewindClick },
      dom.div({ className: "info" }, dom.div({ className: "label" }, label)),
      dom.div({ className: "button" }, dom.div({ className: "img" }))
    );
  }

  renderIcon() {
    const { level, type } = this.props;

    return MessageIcon({ level, type });
  }

  renderTimestamp() {
    if (!this.props.timestampsVisible) {
      return null;
    }

    const timestampString = this.props.executionPointTime
      ? l10n.timestampString(this.props.executionPointTime)
      : "";

    return dom.span(
      {
        className: "timestamp devtools-monospace",
      },
      timestampString
    );
  }

  renderErrorState() {
    const newBugUrl =
      "https://github.com/RecordReplay/devtools/issues/new?assignees=&labels=&template=bug_report.md&title=Console%20error:";
    const timestampEl = this.renderTimestamp();

    return dom.div(
      {
        className: "message error message-did-catch",
      },
      timestampEl,
      MessageIcon({ level: "error" }),
      dom.span(
        { className: "message-body-wrapper" },
        dom.span(
          {
            className: "message-flex-body",
          },
          // Add whitespaces for formatting when copying to the clipboard.
          timestampEl ? " " : null,
          dom.span(
            { className: "message-body devtools-monospace" },
            l10n.getFormatStr("webconsole.message.componentDidCatch.label", [newBugUrl]),
            dom.button(
              {
                className: "devtools-button",
                onClick: () =>
                  navigator.clipboard.writeText(
                    JSON.stringify(
                      this.props.message,
                      function (key, value) {
                        // The message can hold one or multiple fronts that we need to serialize
                        if (value && value.getGrip) {
                          return value.getGrip();
                        }
                        return value;
                      },
                      2
                    )
                  ),
              },
              "Copy message metadata to clipboard"
            )
          )
        )
      ),
      dom.br()
    );
  }

  // eslint-disable-next-line complexity
  render() {
    if (this.state && this.state.error) {
      return this.renderErrorState();
    }

    const {
      open,
      collapsible,
      collapseTitle,
      source,
      type,
      isPaused,
      level,
      indent,
      topLevelClasses,
      messageBody,
      frame,
      stacktrace,
      exceptionDocURL,
      executionPoint,
      messageId,
      notes,
      isPrimaryHighlighted,
    } = this.props;

    topLevelClasses.push("message", source, type, level);
    if (open) {
      topLevelClasses.push("open");
    }

    if (isPaused) {
      topLevelClasses.push("paused");
    }

    if (isPrimaryHighlighted) {
      topLevelClasses.push("primary-highlight");
    }

    const timestampEl = this.renderTimestamp();
    const icon = this.renderIcon();
    const overlayButton = this.renderOverlayButton();

    // Figure out if there is an expandable part to the message.
    let attachment = null;
    if (this.props.attachment) {
      attachment = this.props.attachment;
    } else if (stacktrace && open) {
      attachment = dom.div(
        {
          className: "stacktrace devtools-monospace",
        },
        createElement(SmartTrace, {
          stacktrace,
          onViewSourceInDebugger: this.onViewSourceInDebugger,
          onReady: this.props.maybeScrollToBottom,
        })
      );
    }

    // If there is an expandable part, make it collapsible.
    let collapse = null;
    if (collapsible) {
      collapse = createElement(CollapseButton, {
        open,
        title: collapseTitle,
        onClick: this.toggleMessage,
      });
    }

    let notesNodes;
    if (notes) {
      notesNodes = notes.map(note =>
        dom.span(
          { className: "message-flex-body error-note" },
          dom.span({ className: "message-body devtools-monospace" }, "note: " + note.messageBody),
          dom.span(
            { className: "message-location devtools-monospace" },
            note.frame
              ? FrameView({
                  frame: note.frame,
                  onClick: this.onViewSourceInDebugger,
                  showEmptyPathAsHost: true,
                })
              : null
          )
        )
      );
    } else {
      notesNodes = [];
    }

    const repeat =
      this.props.repeat && this.props.repeat > 1
        ? createElement(MessageRepeat, { repeat: this.props.repeat })
        : null;

    // Configure the location.
    const location = dom.span(
      { className: "message-location devtools-monospace" },
      frame
        ? FrameView({
            frame,
            onClick: frame ? this.onViewSourceInDebugger : undefined,
            showEmptyPathAsHost: true,
            messageSource: source,
          })
        : null
    );

    let learnMore;
    if (exceptionDocURL) {
      learnMore = dom.a(
        {
          className: "learn-more-link webconsole-learn-more-link",
          href: exceptionDocURL,
          title: exceptionDocURL.split("?")[0],
          onClick: this.onLearnMoreClick,
        },
        `[${"Learn More"}]`
      );
    }

    const bodyElements = Array.isArray(messageBody) ? messageBody : [messageBody];

    const mouseEvents = executionPoint
      ? { onMouseEnter: this.onMouseEvent, onMouseLeave: this.onMouseEvent }
      : {};

    return dom.div(
      {
        className: topLevelClasses.join(" "),
        ...mouseEvents,
        "data-message-id": messageId,
        "aria-live": type === MESSAGE_TYPE.COMMAND ? "off" : "polite",
        ref: node => (this.messageNode = node),
      },
      overlayButton,
      timestampEl,
      MessageIndent({
        indent,
      }),
      icon,
      collapse,
      dom.span(
        { className: "message-body-wrapper" },
        dom.span(
          {
            className: "message-flex-body",
            onClick: collapsible ? this.toggleMessage : undefined,
          },
          // Add whitespaces for formatting when copying to the clipboard.
          timestampEl ? " " : null,
          dom.span(
            { className: "message-body devtools-monospace" },
            location,
            " ",
            ...bodyElements,
            learnMore
          ),
          repeat ? " " : null,
          repeat
        ),
        attachment,
        ...notesNodes
      ),
      // If an attachment is displayed, the final newline is handled by the attachment.
      attachment ? null : dom.br()
    );
  }
}

module.exports = withAuth0(withRouter(Message));

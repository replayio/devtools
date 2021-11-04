import React, { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";
import PortalDropdown from "ui/components/shared/PortalDropdown";
import { UIState } from "ui/state";
import { clearEventTooltip, showEventTooltip, viewSourceInDebugger } from "../actions/eventTooltip";
import { getEventTooltipContent, getEventTooltipNodeId } from "../reducers/eventTooltip";
import { EventInfo } from "../state/eventTooltip";

interface EventTooltipProps {
  nodeId: string;
}

class EventTooltip extends PureComponent<EventTooltipProps & PropsFromRedux> {
  constructor(props: EventTooltipProps & PropsFromRedux) {
    super(props);

    this.setExpanded = this.setExpanded.bind(this);
  }

  setExpanded(expanded: boolean) {
    const { clearEventTooltip, showEventTooltip } = this.props;

    if (expanded) {
      showEventTooltip(this.props.nodeId);
    } else {
      clearEventTooltip();
    }
  }

  renderEvents(events: EventInfo[] | null) {
    if (!events) return null;

    const { viewSourceInDebugger } = this.props;

    return events.map((event, index) => {
      const phase = event.capturing ? "Capturing" : "Bubbling";

      return (
        <div key={index} className="event-header">
          <span className="event-tooltip-event-type" title={event.type}>
            {event.type}
          </span>
          <span className="event-tooltip-filename devtools-monospace" title={event.origin}>
            {event.origin}
          </span>
          <div
            className="event-tooltip-debugger-icon"
            title="Open in Debugger"
            onClick={() => viewSourceInDebugger(event)}
          ></div>
          <div className="event-tooltip-attributes-container">
            <div className="event-tooltip-attributes-box">
              <span className="event-tooltip-attributes" title={phase}>
                {phase}
              </span>
            </div>
          </div>
        </div>
      );
    });
  }

  render() {
    const { events } = this.props;

    return (
      <PortalDropdown
        buttonContent="event"
        buttonStyle="inspector-badge interactive"
        position="top-left"
        expanded={!!events}
        setExpanded={this.setExpanded}
      >
        <div className="devtools-tooltip-events-container old-portal">
          {this.renderEvents(events)}
        </div>
      </PortalDropdown>
    );
  }
}

const mapStateToProps = (state: UIState, { nodeId }: EventTooltipProps) => ({
  events: getEventTooltipNodeId(state) === nodeId ? getEventTooltipContent(state) : null,
});
const connector = connect(mapStateToProps, {
  showEventTooltip,
  clearEventTooltip,
  viewSourceInDebugger,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(EventTooltip);

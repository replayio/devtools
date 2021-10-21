const React = require("react");
const { useState } = React;
const EventListeners = require("devtools/client/debugger/src/components/SecondaryPanes/EventListeners")
  .default;
const Dropdown = require("ui/components/shared/Dropdown").default;
const { trackEvent } = require("ui/utils/telemetry");

require("./Events.css");

export function Events() {
  const [expanded, setExpanded] = useState(false);

  const buttonContent = (
    <>
      <div className="img expand" />
      <span className="label">Events</span>
    </>
  );

  return (
    <div className="event-breakpoints text-xs">
      <Dropdown
        buttonContent={buttonContent}
        setExpanded={expanded => {
          if (expanded) {
            trackEvent("console.events.open");
          }
          setExpanded(expanded);
        }}
        expanded={expanded}
        buttonStyle={"secondary"}
      >
        <EventListeners />
      </Dropdown>
    </div>
  );
}

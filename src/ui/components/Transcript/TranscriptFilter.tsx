import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import "./TranscriptFilter.css";
import { UIState } from "ui/state";
import { actions } from "ui/actions";

function TranscriptFilter({ shouldShowLoneEvents, toggleShowLoneEvents }: PropsFromRedux) {
  return (
    <button className="transcript-filter" onClick={toggleShowLoneEvents}>
      {shouldShowLoneEvents ? (
        <div
          className="img filter-circle-outline"
          title="Only show events with attached comments"
        />
      ) : (
        <div className="img filter-circle-fill" title="Show all events" />
      )}
    </button>
  );
}

const connector = connect(
  (state: UIState) => ({
    shouldShowLoneEvents: selectors.getShouldShowLoneEvents(state),
  }),
  { toggleShowLoneEvents: actions.toggleShowLoneEvents }
);

type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TranscriptFilter);

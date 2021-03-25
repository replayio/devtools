import React from "react";
import { connect, ConnectedProps } from "react-redux";
import useAuth0 from "ui/utils/useAuth0";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";

import "./ReplyButton.css";
import { Comment, Event, FloatingItem } from "ui/state/comments";

type ReplyButtonProps = PropsFromRedux & {
  item: Comment | Event | FloatingItem;
};

function ReplyButton({ item, setModal, replyToItem }: ReplyButtonProps) {
  const { isAuthenticated } = useAuth0();

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      return setModal("login");
    }

    replyToItem(item);
  };

  return (
    <button title="Add a comment" className="transcript-entry-action" onClick={onClick}>
      <span className="material-icons">reply</span>
    </button>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
  }),
  {
    setModal: actions.setModal,
    replyToItem: actions.replyToItem,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ReplyButton);

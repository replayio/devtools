import React from "react";
import { connect, ConnectedProps } from "react-redux";
import Icon from "ui/components/shared/Icon";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";

const { MESSAGE_TYPE } = require("devtools/client/webconsole/constants");
const actions = require("devtools/client/webconsole/actions/index");
const { getAllMessagesById } = require("devtools/client/webconsole/selectors/messages");

type Message = {
  type: string;
};

const getIsEnabled = (messages: Map<string, Message>) => {
  const evalTypes = [MESSAGE_TYPE.COMMAND, MESSAGE_TYPE.RESULT];
  return [...messages].find(([_, message]) => evalTypes.includes(message.type));
};

function ClearButton(props: PropsFromRedux) {
  const { messagesClearEvaluations, allMessagesById } = props;
  const isEnabled = getIsEnabled(allMessagesById);

  const onClick = () => {
    trackEvent("console.clear_messages");
    messagesClearEvaluations();
  };

  return (
    <button
      className="devtools-clear-icon flex"
      title={isEnabled ? "Clear console evaluations" : "No console evaluations to clear"}
      disabled={!isEnabled}
      onClick={onClick}
    >
      <Icon
        filename="trash"
        className={
          isEnabled
            ? "bg-iconColor hover:bg-primaryAccent"
            : "bg-iconColorDisabled hover:bg-primaryAccent"
        }
      />
    </button>
  );
}

const connector = connect(
  (state: UIState) => ({
    allMessagesById: getAllMessagesById(state),
  }),
  {
    messagesClearEvaluations: actions.messagesClearEvaluations,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ClearButton);

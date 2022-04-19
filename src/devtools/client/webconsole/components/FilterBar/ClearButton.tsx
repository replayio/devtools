import { getAllMessagesById } from "devtools/client/webconsole/selectors/messages";
import React, { useMemo } from "react";
import { connect, ConnectedProps } from "react-redux";
import Icon from "ui/components/shared/Icon";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";

const actions = require("devtools/client/webconsole/actions/index");
const { MESSAGE_TYPE } = require("devtools/client/webconsole/constants");

type Message = {
  type: string;
};

const evalTypes = [MESSAGE_TYPE.COMMAND, MESSAGE_TYPE.RESULT];

function ClearButton(props: PropsFromRedux) {
  const { messagesClearEvaluations, allMessagesById } = props;

  const isEnabled = useMemo(() => {
    const foundMessage = Object.values(allMessagesById.entities).find(message => {
      return evalTypes.includes(message!.type);
    });
    return !!foundMessage;
  }, [allMessagesById]);

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

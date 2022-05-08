import { connect } from "react-redux";
import { getActiveInstance } from "@redux-devtools/app/lib/cjs/reducers/instances";
import { act } from "react-dom/test-utils";

function ActionsList({ liftedState }) {
  const actions = Object.values(liftedState.actionsById);
  console.log(actions);
  return (
    <div>
      {actions.map(action => (
        <div>{action.action.type}</div>
      ))}
    </div>
  );
}

export default connect(state => {
  const id = getActiveInstance(state.instances);
  console.log("state", id, state);
  return {
    liftedState: state.instances.states[id],
  };
})(ActionsList);

import { connect, useSelector } from "react-redux";
import { getActiveInstance } from "@redux-devtools/app/lib/cjs/reducers/instances";

function ActionRow({ action }) {
  const reduxAnnotations = useContext(ReduxAnnotationsContext);
  const currentExecutionPoint = useSelector(getCurrentExecutionPoint);
  const annotation = reduxAnnotations[action.id];
  const executionPoint = annotation.executionPoint;
  const isCurrentlyPaused = currentExecutionPoint == executionPoint;

  return;
  <div className={isCurrentlyPaused ? "redline" : ""}>{action.action.type}</div>;
}

function ActionsList({ liftedState }) {
  const actions = Object.values(liftedState.actionsById);

  return (
    <div>
      {actions.map(action => (
        <ActionRow action={action} />
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

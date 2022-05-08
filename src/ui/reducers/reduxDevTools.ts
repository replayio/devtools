const defaultState = {
  selectedMode: "state" | "payload" | "diff",
};

export default function update(
  state = defaultState,
  action: ReactDevToolsAction | SetCurrentPointAction
): ReactDevToolsState {
  switch (action.type) {
    case "new-annotations": {
      const reduxAnnotations = action.annotations.filter(({ kind }) => kind === "redux");
      const newAnnotations = processReduxAnnotations(reduxAnnotations);
      return {
        annotations: [...state.annotations, ...newAnnotations],
      };
    }
  }
}

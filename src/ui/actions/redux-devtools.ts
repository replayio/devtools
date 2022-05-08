export function bootstrapReduxDevTools() {
  return dispatch => {
    // we can probably delete this
    // dispatch({
    //   type: "socket/CONNECT_REQUEST",
    // });

    dispatch({
      type: "devTools/UPDATE_STATE",
      request: {
        type: "LIFTED",
        id: "default",
      },
    });
  };
}

// export function addNewAnnotations(annotations) {
//   return dispatch => {
//     batch(() => {
//       const newReduxActionAnnotations = processReduxAnnotations(reduxDevtoolsAnnotations);
//       newReduxActionAnnotations.forEach(annotation => dispatch(annotation.action));
//     });
//   };
// }

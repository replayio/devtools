import { actions } from "react-table";

const defaultState = {
  annotations: [],
};

export function update() {
  switch (action.type) {
    case "new-annotations": {
      const newAnnotations = action.annotations.map(annotation => JSON.parse(annotation))
      return {
        annotations: [...state.annotations, ...newAnnotations]
      };
    }
}

export const reduxAnnotations = createSelector(state.annotations => state.annotations.filter(({ kind }) => kind === "redux"));
export const reactAnnotations = createSelector(state.annotations => state.annotations.filter(({ kind }) => kind === "react"));
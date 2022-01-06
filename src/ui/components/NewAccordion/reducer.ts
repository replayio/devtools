import {
  accomodateSectionIdealHeight,
  ACCORDION_HEIGHT,
  embiggenSection,
  ensmallenSection,
  getClosestPreviousExpandedIndex,
  getHeightBeforeIndex,
  getMinHeightAfterIndex,
  getNextTargetIndex,
  HEADER_HEIGHT,
} from "./utils";

export type Section = {
  displayedHeight: number;
  expanded: boolean;
};
type ResizingParams = {
  index: number;
  initialY: number;
  originalSections: Section[];
};
export type AccordionState = {
  sections: Section[];
  resizingParams: ResizingParams | null;
};
type ExpandSectionAction = { type: "expand_section"; index: number };
type CollapseSectionAction = { type: "collapse_section"; index: number };
type StartResizingAction = { type: "start_resizing"; index: number; initialY: number };
type EndResizingAction = { type: "end_resizing" };
type ResizeAction = { type: "resize"; currentY: number };
type AccordionAction =
  | ExpandSectionAction
  | CollapseSectionAction
  | StartResizingAction
  | EndResizingAction
  | ResizeAction;

const createDefaultSection = () => {
  return {
    expanded: false,
    displayedHeight: 0,
  };
};

// Actions

export function expandSection(index: number): ExpandSectionAction {
  return { type: "expand_section", index };
}
export function collapseSection(index: number): CollapseSectionAction {
  return { type: "collapse_section", index };
}
export function startResizing(index: number, initialY: number): StartResizingAction {
  return { type: "start_resizing", index, initialY };
}
export function endResizing(): EndResizingAction {
  return { type: "end_resizing" };
}
export function resize(currentY: number): ResizeAction {
  return { type: "resize", currentY };
}

// Selectors

export const getSectionDisplayedHeight = (state: AccordionState, index: number) =>
  state.sections[index].displayedHeight;
export const getIsCollapsed = (state: AccordionState, index: number) =>
  !state.sections[index].expanded;
export const getPosition = (state: AccordionState, index: number) => {
  const { sections } = state;

  const top = sections.slice(0, index).reduce((a, section) => {
    const increment = section.expanded ? section.displayedHeight : HEADER_HEIGHT;
    return a + (increment || 0);
  }, 0);
  const height = getIsCollapsed(state, index)
    ? HEADER_HEIGHT
    : getSectionDisplayedHeight(state, index);

  return { top, height };
};
export const getIsIndexResizable = (state: AccordionState, index: number) => {
  const { sections } = state;

  const hasTargetIndex = getNextTargetIndex(sections, index, index);
  const isFirstIndex = index === 0;

  return !!(!isFirstIndex && hasTargetIndex > -1);
};
export const getIsResizing = (state: AccordionState) => {
  return !!state.resizingParams;
};
export const getResizingParams = (state: AccordionState) => {
  return state.resizingParams;
};

// Reducer

export function getInitialState(count: number): AccordionState {
  const sections: Section[] = [];

  for (let i = 0; i < count; i++) {
    sections.push(createDefaultSection());
  }

  return { sections, resizingParams: null };
}

export function reducer(state: AccordionState, action: AccordionAction) {
  switch (action.type) {
    case "collapse_section": {
      const { index } = action;

      let newSections = [...state.sections];
      newSections[index].expanded = false;
      newSections = ensmallenSection(newSections, index);

      return { ...state, sections: newSections };
    }
    case "expand_section": {
      const { index } = action;

      let newSections = [...state.sections];
      newSections = embiggenSection(newSections, index);
      newSections[index].expanded = true;

      return { ...state, sections: newSections };
    }
    case "start_resizing": {
      const { index, initialY } = action;
      const originalSections = [...state.sections];

      return { ...state, resizingParams: { index, initialY, originalSections } };
    }
    case "end_resizing": {
      return { ...state, resizingParams: null };
    }
    case "resize": {
      const { sections, resizingParams } = state;

      if (!resizingParams) return { ...state };

      const { currentY } = action;
      const { initialY, index, originalSections } = resizingParams;

      const delta = initialY - currentY;
      let newSections = [...originalSections];

      if (delta > 0) {
        // Negative delta means the user resized upwards, so the section should get bigger.
        const idealHeight = newSections[index].displayedHeight + delta;
        let startIndex = getNextTargetIndex(sections, index, index);
        newSections = accomodateSectionIdealHeight(newSections, index, idealHeight, startIndex);
      } else {
        // Positive means the user resized downwards, so the section should get smaller.
        // Making a section smaller is equivalent to making the closest expanded previous section it
        // smaller, so this does that.
        const i = getClosestPreviousExpandedIndex(sections, index);

        // Need to cap the maxHeight here ahead of time. The previous index doesn't
        // know when the original index has already hit its minimum height. Without this,
        // it'll start expanding upwards when it runs out of downward space.
        const maxHeight =
          ACCORDION_HEIGHT -
          getHeightBeforeIndex(sections, i) -
          getMinHeightAfterIndex(sections, i);
        const idealHeight = Math.min(newSections[i].displayedHeight - delta, maxHeight);
        let startIndex = getNextTargetIndex(sections, i);

        newSections = accomodateSectionIdealHeight(newSections, i, idealHeight, startIndex);
      }

      return { ...state, sections: newSections };
    }
    default: {
      throw new Error("unknown Accordion action");
    }
  }
}

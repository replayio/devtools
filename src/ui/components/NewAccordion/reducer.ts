import { findLastIndex } from "lodash";

type Section = {
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

const MIN_HEIGHT = 150;
const ACCORDION_HEIGHT = 600;
const HEADER_HEIGHT = 24 + 1;
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
      const originalSections = { ...state.sections };

      console.log("start");
      return { ...state, resizingParams: { index, initialY, originalSections } };
    }
    case "end_resizing": {
      console.log("end");
      return { ...state, resizingParams: null };
    }
    case "resize": {
      const { sections, resizingParams } = state;

      if (!resizingParams) return { ...state };

      const { currentY } = action;
      const { initialY, index } = resizingParams;

      const delta = currentY - initialY;
      let newSections = [...sections];

      console.log({ delta });
      if (delta < 0) {
        // moving up:
        // - section height keeps expanding by annexing its immediate preceding section(s)
        // bottom stays where itis
      } else {
        // moving down:
        // - section height keeps expanding by annexing the
      }

      return { ...state, sections: newSections };
    }
    default: {
      throw new Error("unknown Accordion action");
    }
  }
}

// Utils

const getSectionsTotalHeight = (sections: Section[]) => {
  return sections.reduce((a, section) => {
    return a + getActualHeight(section);
  }, 0);
};
const getUnoccupiedHeight = (sections: Section[]) => {
  const occupiedHeight = getSectionsTotalHeight(sections);
  return ACCORDION_HEIGHT - occupiedHeight;
};
const getNextTargetIndex = (sections: Section[], index: number, endIndex?: number) => {
  const sec = sections.slice(0, endIndex);
  return findLastIndex(sec, (s, i) => s.expanded && i !== index);
};
const getActualHeight = (section: Section) => {
  return section.expanded ? section.displayedHeight || 0 : HEADER_HEIGHT;
};

// This takes the original sections and the index of section we're trying to "embiggen".
// It then tries to accommodate that sections height, and allows it to be greedy
// (i.e. shrink other sections up to min-height).
const embiggenSection = (sections: Section[], index: number) => {
  const newSections = [...sections];

  // If the displayedHeight is 0, then the section should be greedy and take up
  // as much space as possible.
  if (!newSections[index].displayedHeight) {
    newSections[index] = { ...newSections[index], displayedHeight: ACCORDION_HEIGHT };
  }

  const idealHeight = newSections[index].displayedHeight || 0;
  let displayedHeight = getUnoccupiedHeight(newSections) + getActualHeight(newSections[index]);
  let nextDonorIndex = getNextTargetIndex(newSections, index);

  while (displayedHeight !== idealHeight && nextDonorIndex > -1) {
    const donor = newSections[nextDonorIndex];
    const donorHeight = donor.displayedHeight || 0; // could be cleaner

    const availableHeightToGive = donorHeight - MIN_HEIGHT;
    const heightRemaining = idealHeight - displayedHeight;
    const heightDonated = Math.min(availableHeightToGive, heightRemaining);

    newSections[nextDonorIndex] = {
      ...newSections[nextDonorIndex],
      displayedHeight: donorHeight - heightDonated,
    };

    displayedHeight = displayedHeight + heightDonated;
    nextDonorIndex = getNextTargetIndex(newSections, index, nextDonorIndex);
  }

  newSections[index] = { ...newSections[index], displayedHeight };
  return newSections;
};

// This reallocates the space freed up by collapsing a section to the
// last expanded section, if it exists.
const ensmallenSection = (sections: Section[], index: number) => {
  const newSections = [...sections];
  const receiverIndex = getNextTargetIndex(sections, index);

  if (receiverIndex > -1) {
    newSections[receiverIndex] = { ...newSections[receiverIndex], displayedHeight: 0 };
    return embiggenSection(sections, receiverIndex);
  }

  return sections;
};

// const resizeHandler = () => {
//   const { index, initialY, originalSections } = resizingParams;
//   const originalHeight = originalSections[index];

//   const newSections = [...originalSections];

//   const originalDelta = e.screenY - initialY;
//   let remainingDelta = originalDelta;

//   // if delta is positive, we're squeezing the proceeding sections.
//   // need to make sure we're allowed to in the first place, and as we
//   // make the selected section smaller, that we embiggen the preceding
//   // sections accordingly.
//   if (remainingDelta > 0) {
//     let nextIndex = getLastExpandedIndex(collapsed);

//     // Walk back from the last expanded index until you reach the current index.
//     while (nextIndex && nextIndex > index) {
//       const originalCrease = originalCreases[nextIndex];
//       const receivableDelta = Math.min(originalCrease - MIN_HEIGHT, remainingDelta);

//       if (receivableDelta) {
//         newCreases[nextIndex] = originalCreases[nextIndex] - receivableDelta;
//         remainingDelta -= receivableDelta;
//       }

//       nextIndex = getLastExpandedIndex(collapsed, nextIndex);
//     }

//     newCreases[index] = originalHeight + originalDelta - remainingDelta;
//   } else if (remainingDelta < 0) {
//     // if delta is negative, we're squeezing the preceding sections.
//     // need to make sure we're allowed to in the first place. The selected
//     // section will get larger, and we need to embiggen the proceeding sections
//     // accordingly.
//     let nextIndex = getFirstExpandedIndex(collapsed);

//     // Walk forward from the first expanded index until you reach the current index.
//     while (nextIndex >= 0 && nextIndex <= index) {
//       const originalCrease = originalCreases[nextIndex];
//       const receivableDelta = Math.max(MIN_HEIGHT - originalCrease, remainingDelta);

//       if (receivableDelta) {
//         newCreases[nextIndex] = originalCreases[nextIndex] + receivableDelta;
//         remainingDelta -= receivableDelta;
//       }

//       nextIndex = getFirstExpandedIndex(collapsed, nextIndex + 1);
//     }

//     const lastExpandedIndex = getLastExpandedIndex(collapsed);
//     // Because there's extra space after the current index, we need to
//     // redistribute it to the last expanded index.
//     if (lastExpandedIndex && lastExpandedIndex !== index) {
//       newCreases[lastExpandedIndex] =
//         originalCreases[lastExpandedIndex] - (originalDelta - remainingDelta);
//     }
//   }

//   setCreases(newCreases);

// }

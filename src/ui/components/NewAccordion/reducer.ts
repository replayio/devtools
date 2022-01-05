import { findLastIndex } from "lodash";

type Section = {
  displayedHeight: number;
  expanded: boolean;
};
export type AccordionState = {
  sections: Section[];
};
type ExpandSectionAction = { type: "expand_section"; index: number };
type CollapseSectionAction = { type: "collapse_section"; index: number };
type AccordionAction = ExpandSectionAction | CollapseSectionAction;

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

// Reducer

export function getInitialState(count: number): AccordionState {
  const sections: Section[] = [];

  for (let i = 0; i < count; i++) {
    sections.push(createDefaultSection());
  }

  return { sections };
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

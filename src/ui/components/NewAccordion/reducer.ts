type Section = {
  idealHeight: number;
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
    idealHeight: 0,
    displayedHeight: HEADER_HEIGHT,
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
    return a + increment;
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
      console.log("ensmallen", index);
      newSections = ensmallenSection(newSections, index);

      return { ...state, sections: newSections };
    }
    case "expand_section": {
      const { index } = action;

      let newSections = [...state.sections];
      newSections[index].expanded = true;
      newSections = embiggenSection(newSections, index);

      return { ...state, sections: newSections };
    }
    default: {
      throw new Error("unknown Accordion action");
    }
  }
}

// Utils

const minimizeSections = (sections: Section[]) => {
  return sections.map((section, i) => {
    let newHeight = Math.min(section.displayedHeight, MIN_HEIGHT);

    if (!section.expanded) {
      newHeight = HEADER_HEIGHT;
    }

    return { ...section, displayedHeight: newHeight };
  });
};
const getSectionsTotalHeight = (sections: Section[]) => {
  return sections.reduce((a, section) => a + section.displayedHeight, 0);
};
const getLastExpandedIndex = (sections: Section[], endIndex?: number) => {
  const lastIndex = sections
    .slice(0, endIndex)
    .map(s => s.expanded)
    .lastIndexOf(true);

  if (lastIndex === -1) return null;

  return lastIndex;
};
const getReceiverIndex = (sections: Section[], index: number) => {
  const i = sections.findIndex((s, i) => s.expanded && i !== index);

  if (i < 0) return null;

  return i;
};

const embiggenSection = (sections: Section[], index: number) => {
  const beforeSections = minimizeSections(sections.slice(0, index));
  const afterSections = minimizeSections(sections.slice(index + 1));

  console.log({ beforeSections, afterSections });

  const selectedSectionHeight =
    ACCORDION_HEIGHT -
    (getSectionsTotalHeight(beforeSections) + getSectionsTotalHeight(afterSections));
  const selectedSection = { ...sections[index], displayedHeight: selectedSectionHeight };

  return [...beforeSections, selectedSection, ...afterSections];
};
const ensmallenSection = (sections: Section[], index: number) => {
  // need to get the index of the section that will grab all the space
  // which is essentially the last expanded section that's not the current index.
  // const lastExpandedIndex = getLastExpandedIndex(sections);
  const receiverIndex = getReceiverIndex(sections, index);

  if (receiverIndex && receiverIndex !== index) {
    console.log("a");
    return embiggenSection(sections, receiverIndex);
  }
  // } else if (closestPrecedingExpandedIndex && closestPrecedingExpandedIndex !== index) {
  //   console.log("b", { closestPrecedingExpandedIndex });
  //   return embiggenSection(sections, closestPrecedingExpandedIndex);
  // }

  console.log("c", { lastExpandedIndex, closestPrecedingExpandedIndex });
  // sections[index] = { ...sections[index], displayedHeight: HEADER_HEIGHT };
  return sections;
};

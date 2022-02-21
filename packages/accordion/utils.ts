import findLastIndex from "lodash/findLastIndex";
import { HEADER_HEIGHT, MIN_HEIGHT } from "./constants";
import { Section } from "./reducer";

// Utils
const getSectionsTotalHeight = (sections: Section[]) => {
  return sections.reduce((a, section) => {
    return a + getActualHeight(section);
  }, 0);
};
export const getHeightBeforeIndex = (sections: Section[], index: number) => {
  const sec = sections.slice(0, index);
  return sec.reduce((a, section) => {
    return a + getActualHeight(section);
  }, 0);
};
export const getMinHeightAfterIndex = (sections: Section[], index: number) => {
  const sec = sections.slice(index + 1);
  return sec.reduce((a, section) => {
    return a + getMinHeight(section);
  }, 0);
};
const getUnoccupiedHeight = (sections: Section[], containerHeight: number) => {
  const occupiedHeight = getSectionsTotalHeight(sections);
  return containerHeight - occupiedHeight;
};
export const getNextTargetIndex = (sections: Section[], index: number, endIndex?: number) => {
  const sec = sections.slice(0, endIndex);
  return findLastIndex(sec, (s, i) => s.expanded && i !== index);
};
export const getClosestPreviousExpandedIndex = (sections: Section[], index: number) => {
  const sec = sections.slice(0, index);
  return findLastIndex(sec, s => s.expanded);
};
const getMinHeight = (section: Section) => {
  return section.expanded ? MIN_HEIGHT : HEADER_HEIGHT;
};
const getActualHeight = (section: Section) => {
  return section.expanded ? section.displayedHeight : HEADER_HEIGHT;
};

export const embiggenSection = (s: Section[], index: number, containerHeight: number) => {
  const sections = [...s];

  // If the displayedHeight is 0, then the section should be greedy and take up
  // as much space as possible.
  if (!sections[index].displayedHeight) {
    sections[index] = { ...sections[index], displayedHeight: containerHeight };
  }

  const idealHeight = sections[index].displayedHeight;
  const firstIndex = getNextTargetIndex(sections, index);

  return accomodateSectionIdealHeight(sections, index, idealHeight, firstIndex, containerHeight);
};

// This reallocates the space freed up by collapsing a section to the
// last expanded section, if it exists.
export const ensmallenSection = (sections: Section[], index: number, containerHeight: number) => {
  const newSections = [...sections];
  const receiverIndex = getNextTargetIndex(sections, index);

  if (receiverIndex > -1) {
    newSections[receiverIndex] = { ...newSections[receiverIndex], displayedHeight: 0 };
    return embiggenSection(sections, receiverIndex, containerHeight);
  }

  return sections;
};

// This takes an index for a section that we're trying to increase the height of.
// That section will then be expanded to the provided idealHeight by taking up space
// from surrounding expanded sections, beginning with the provided firstIndex.
export function accomodateSectionIdealHeight(
  s: Section[],
  index: number,
  idealHeight: number,
  firstIndex: number,
  containerHeight: number
) {
  const sections = [...s];

  let currentHeight = getActualHeight(sections[index]);
  let nextDonorIndex = firstIndex;

  if (getUnoccupiedHeight(sections, containerHeight)) {
    currentHeight += getUnoccupiedHeight(sections, containerHeight);
  }

  while (currentHeight !== idealHeight && nextDonorIndex > -1) {
    const donor = sections[nextDonorIndex];
    const donorHeight = donor.displayedHeight;

    const availableHeightToGive = donorHeight - MIN_HEIGHT;
    const heightRemaining = idealHeight - currentHeight;
    const heightDonated = Math.min(availableHeightToGive, heightRemaining);

    sections[nextDonorIndex] = {
      ...sections[nextDonorIndex],
      displayedHeight: donorHeight - heightDonated,
    };

    currentHeight = currentHeight + heightDonated;
    nextDonorIndex = getNextTargetIndex(sections, index, nextDonorIndex);
  }

  sections[index] = { ...sections[index], displayedHeight: currentHeight };
  return sections;
}

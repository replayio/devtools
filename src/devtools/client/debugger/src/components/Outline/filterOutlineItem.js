import { score as fuzzaldrinScore } from "fuzzaldrin-plus";

/**
 * Check whether the name argument matches the fuzzy filter argument
 */
export const filterOutlineItem = (name, filter) => {
  // Set higher to make the fuzzaldrin filter more specific
  const FUZZALDRIN_FILTER_THRESHOLD = 15000;
  if (!filter) {
    return true;
  }

  if (filter.length === 1) {
    // when filter is a single char just check if it starts with the char
    return filter.toLowerCase() === name.toLowerCase()[0];
  }
  return fuzzaldrinScore(name, filter) > FUZZALDRIN_FILTER_THRESHOLD;
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const PropTypes = require("prop-types");

/**
 * A CSS class.
 */
export const classes = {
  // The CSS class name.
  name: PropTypes.string,

  // Whether or not the CSS class is applied.
  isApplied: PropTypes.bool,
};

/**
 * A CSS declaration.
 */
export const declaration = {
  // Array of the computed properties for a CSS declaration.
  computedProperties: PropTypes.arrayOf(
    PropTypes.shape({
      // Whether or not the computed property is overridden.
      isOverridden: PropTypes.bool,
      // The computed property name.
      name: PropTypes.string,
      // The computed priority (either "important" or an empty string).
      priority: PropTypes.string,
      // The computed property value.
      value: PropTypes.string,
    })
  ),

  // An unique CSS declaration id.
  id: PropTypes.string,

  // Whether or not the declaration is valid. (Does it make sense for this value
  // to be assigned to this property name?)
  isDeclarationValid: PropTypes.bool,

  // Whether or not the declaration is enabled.
  isEnabled: PropTypes.bool,

  // Whether or not the declaration is invisible. In an inherited rule, only the
  // inherited declarations are shown and the rest are considered invisible.
  isInvisible: PropTypes.bool,

  // Whether or not the declaration's property name is known.
  isKnownProperty: PropTypes.bool,

  // Whether or not the property name is valid.
  isNameValid: PropTypes.bool,

  // Whether or not the the declaration is overridden.
  isOverridden: PropTypes.bool,

  // Whether or not the declaration is changed by the user.
  isPropertyChanged: PropTypes.bool,

  // The declaration's property name.
  name: PropTypes.string,

  // The declaration's parsed property value.
  parsedValue: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),

  // The declaration's priority (either "important" or an empty string).
  priority: PropTypes.string,

  // The declaration's property value.
  value: PropTypes.string,
};

export type Declaration = {
  // Array of the computed properties for a CSS declaration.
  computedProperties: {
    // Whether or not the computed property is overridden.
    isOverridden: boolean;
    // The computed property name.
    name: string;
    // The computed priority (either "important" or an empty string).
    priority: string;
    // The computed property value.
    value: string;
  }[];

  // An unique CSS declaration id.
  id: string;

  // Whether or not the declaration is valid. (Does it make sense for this value
  // to be assigned to this property name?)
  isDeclarationValid: boolean;

  // Whether or not the declaration is enabled.
  isEnabled: boolean;

  // Whether or not the declaration is invisible. In an inherited rule, only the
  // inherited declarations are shown and the rest are considered invisible.
  isInvisible: boolean;

  // Whether or not the declaration's property name is known.
  isKnownProperty: boolean;

  // Whether or not the property name is valid.
  isNameValid: boolean;

  // Whether or not the the declaration is overridden.
  isOverridden: boolean;

  // Whether or not the declaration is changed by the user.
  isPropertyChanged: boolean;

  // The declaration's property name.
  name: string;

  // The declaration's parsed property value.
  parsedValue: string | object;

  // The declaration's priority (either "important" or an empty string).
  priority: string;

  // The declaration's property value.
  value: string;
};

/**
 * The pseudo classes redux structure.
 */
export const pseudoClasses = {
  // An object containing the :active pseudo class toggle state.
  ":active": PropTypes.shape({
    // Whether or not the :active pseudo class is checked.
    isChecked: PropTypes.bool,
    // Whether or not the :active pseudo class is disabled.
    isDisabled: PropTypes.bool,
  }),

  // An object containing the :focus pseudo class toggle state.
  ":focus": PropTypes.shape({
    // Whether or not the :focus pseudo class is checked
    isChecked: PropTypes.bool,
    // Whether or not the :focus pseudo class is disabled.
    isDisabled: PropTypes.bool,
  }),

  // An object containing the :focus-within pseudo class toggle state.
  ":focus-within": PropTypes.shape({
    // Whether or not the :focus-within pseudo class is checked
    isChecked: PropTypes.bool,
    // Whether or not the :focus-within pseudo class is disabled.
    isDisabled: PropTypes.bool,
  }),

  // An object containing the :hover pseudo class toggle state.
  ":hover": PropTypes.shape({
    // Whether or not the :hover pseudo class is checked.
    isChecked: PropTypes.bool,
    // Whether or not the :hover pseudo class is disabled.
    isDisabled: PropTypes.bool,
  }),
};

/**
 * A CSS selector.
 */
export const selector = {
  // Function that returns a Promise containing an unique CSS selector.
  getUniqueSelector: PropTypes.func,
  // Array of the selectors that match the selected element.
  matchedSelectors: PropTypes.arrayOf(PropTypes.string),
  // The CSS rule's selector text content.
  selectorText: PropTypes.string,
  // Array of the CSS rule's selectors.
  selectors: PropTypes.arrayOf(PropTypes.string),
};

export type Selector = {
  // Function that returns a Promise containing an unique CSS selector.
  getUniqueSelector: Function;
  // Array of the selectors that match the selected element.
  matchedSelectors: string[];
  // The CSS rule's selector text content.
  selectorText: string;
  // Array of the CSS rule's selectors.
  selectors: string[];
};

/**
 * A CSS Rule.
 */
export const rule = {
  // Array of CSS declarations.
  declarations: PropTypes.arrayOf(PropTypes.shape(declaration)),

  // An unique CSS rule id.
  id: PropTypes.string,

  // An object containing information about the CSS rule's inheritance.
  inheritance: PropTypes.shape({
    // The object id of the NodeFront this rule was inherited from.
    inheritedNodeId: PropTypes.string,
    // A header label for where the element this rule was inherited from.
    inheritedSource: PropTypes.string,
  }),

  // Whether or not the rule does not match the current selected element.
  isUnmatched: PropTypes.bool,

  // Whether or not the rule is an user agent style.
  isUserAgentStyle: PropTypes.bool,

  // // An object containing information about the CSS keyframes rules.
  // keyframesRule: PropTypes.shape({
  //   // The actor ID of the keyframes rule.
  //   id: PropTypes.string,
  //   // The keyframes rule name.
  //   keyframesName: PropTypes.string,
  // }),

  // The pseudo-element keyword used in the rule.
  pseudoElement: PropTypes.string,

  // An object containing information about the CSS rule's selector.
  selector: PropTypes.shape(selector),

  // An object containing information about the CSS rule's stylesheet source.
  sourceLink: PropTypes.shape({
    // The label used for the stylesheet source
    label: PropTypes.string,
    // The title used for the stylesheet source.
    title: PropTypes.string,
  }),

  // The type of CSS rule.
  // See https://developer.mozilla.org/en-US/docs/Web/API/CSSRule#Type_constants
  type: PropTypes.number,
};

export type Rule = {
  // Array of CSS declarations.
  declarations: Declaration[];

  // An unique CSS rule id.
  id: string;

  // An object containing information about the CSS rule's inheritance.
  inheritance: {
    // The object id of the NodeFront this rule was inherited from.
    inheritedNodeId: string;
    // A header label for where the element this rule was inherited from.
    inheritedSource: string;
  };

  // Whether or not the rule does not match the current selected element.
  isUnmatched: boolean;

  // Whether or not the rule is an user agent style.
  isUserAgentStyle: boolean;

  // // An object containing information about the CSS keyframes rules.
  // keyframesRule: {
  //   // The actor ID of the keyframes rule.
  //   id: string,
  //   // The keyframes rule name.
  //   keyframesName: string,
  // }),

  // The pseudo-element keyword used in the rule.
  pseudoElement: string;

  // An object containing information about the CSS rule's selector.
  selector: Selector;

  // An object containing information about the CSS rule's stylesheet source.
  sourceLink: {
    // The label used for the stylesheet source
    label: string;
    // The title used for the stylesheet source.
    title: string;
  };

  // The type of CSS rule.
  // See https://developer.mozilla.org/en-US/docs/Web/API/CSSRule#Type_constants
  type: number;
};

export const rules = {
  isAddRuleEnabled: PropTypes.bool.isRequired,
  highlightedSelector: PropTypes.string.isRequired,
  rules: PropTypes.arrayOf(PropTypes.shape(rule)),
};

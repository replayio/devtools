/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Action } from "redux";

import Rule, { SourceLink } from "../models/rule";
import TextProperty from "../models/text-property";
import { DeclarationState, RuleState } from "../state/rules";

type UpdateAddRuleEnabledAction = Action<"UPDATE_ADD_RULE_ENABLED"> & { enabled: boolean };
type UpdateHighlightedSelectorAction = Action<"UPDATE_HIGHLIGHTED_SELECTOR"> & {
  highlightedSelector: string;
};
type UpdateRulesAction = Action<"UPDATE_RULES"> & { rules: RuleState[] | undefined };
type UpdateSourceLinkAction = Action<"UPDATE_SOURCE_LINK"> & {
  ruleId: string;
  sourceLink: SourceLink;
};
export type RulesAction =
  | UpdateAddRuleEnabledAction
  | UpdateHighlightedSelectorAction
  | UpdateRulesAction
  | UpdateSourceLinkAction;

/**
 * Updates whether or not the add new rule button should be enabled.
 *
 * @param  {Boolean} enabled
 *         Whether or not the add new rule button is enabled.
 */
export function updateAddRuleEnabled(enabled: boolean): UpdateAddRuleEnabledAction {
  return {
    enabled,
    type: "UPDATE_ADD_RULE_ENABLED",
  };
}

/**
 * Updates the highlighted selector.
 *
 * @param  {String} highlightedSelector
 *         The selector of the element to be highlighted by the selector highlighter.
 */
export function updateHighlightedSelector(
  highlightedSelector: string
): UpdateHighlightedSelectorAction {
  return {
    highlightedSelector,
    type: "UPDATE_HIGHLIGHTED_SELECTOR",
  };
}

/**
 * Updates the rules state with the new list of CSS rules for the selected element.
 *
 * @param  {Array} rules
 *         Array of Rule objects containing the selected element's CSS rules.
 */
export function updateRules(rules: Rule[] | null): UpdateRulesAction {
  return {
    rules: rules?.map(rule => getRuleState(rule)),
    type: "UPDATE_RULES",
  };
}

/**
 * Updates the source link information for a given rule.
 *
 * @param  {String} ruleId
 *         The Rule id of the target rule.
 * @param  {Object} sourceLink
 *         New source link data.
 */
export function updateSourceLink(ruleId: string, sourceLink: SourceLink): UpdateSourceLinkAction {
  return {
    ruleId,
    sourceLink,
    type: "UPDATE_SOURCE_LINK",
  };
}

/**
 * Given a rule's TextProperty, returns the properties that are needed to render a
 * CSS declaration.
 *
 * @param  {TextProperty} declaration
 *         A TextProperty of a rule.
 * @param  {String} ruleId
 *         The rule id that is associated with the given CSS declaration.
 * @return {Object} containing the properties needed to render a CSS declaration.
 */
function getDeclarationState(declaration: TextProperty, ruleId: string): DeclarationState {
  return {
    // Array of the computed properties for a CSS declaration.
    computedProperties: declaration.computedProperties,
    // An unique CSS declaration id.
    id: declaration.id,
    // Whether or not the declaration is valid. (Does it make sense for this value
    // to be assigned to this property name?)
    isDeclarationValid: declaration.isValid(),
    // Whether or not the declaration is enabled.
    isEnabled: declaration.enabled,
    // Whether or not the declaration is invisible. In an inherited rule, only the
    // inherited declarations are shown and the rest are considered invisible.
    isInvisible: declaration.invisible,
    // Whether or not the declaration's property name is known.
    isKnownProperty: declaration.isKnownProperty,
    // Whether or not the property name is valid.
    isNameValid: declaration.isNameValid(),
    // Whether or not the the declaration is overridden.
    isOverridden: !!declaration.overridden,
    // Whether or not the declaration is changed by the user.
    isPropertyChanged: declaration.isPropertyChanged,
    // The declaration's property name.
    name: declaration.name,
    // The declaration's parsed property value.
    parsedValue: declaration.parsedValue,
    // The declaration's priority (either "important" or an empty string).
    priority: declaration.priority,
    // The CSS rule id that is associated with this CSS declaration.
    ruleId,
    // The declaration's property value.
    value: declaration.value,
  };
}

/**
 * Given a Rule, returns the properties that are needed to render a CSS rule.
 *
 * @param  {Rule} rule
 *         A Rule object containing information about a CSS rule.
 * @return {Object} containing the properties needed to render a CSS rule.
 */
function getRuleState(rule: Rule): RuleState {
  return {
    // Array of CSS declarations.
    declarations: rule.declarations.map(declaration =>
      getDeclarationState(declaration, rule.domRule.objectId())
    ),
    // An unique CSS rule id.
    id: rule.domRule.objectId(),
    // An object containing information about the CSS rule's inheritance.
    inheritance: rule.inheritance,
    // Whether or not the rule does not match the current selected element.
    isUnmatched: rule.isUnmatched,
    // Whether or not the rule is an user agent style.
    isUserAgentStyle: rule.domRule.isSystem,
    // An object containing information about the CSS keyframes rules.
    // keyframesRule: rule.keyframesRule,
    // The pseudo-element keyword used in the rule.
    pseudoElement: rule.pseudoElement,
    // An object containing information about the CSS rule's selector.
    selector: rule.selector,
    // An object containing information about the CSS rule's stylesheet source.
    sourceLink: rule.sourceLink,
    // The type of CSS rule.
    type: rule.domRule.type,
  };
}

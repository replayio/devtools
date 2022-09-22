/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RuleInheritance, RuleSelector, SourceLink } from "../models/rule";
import type RuleModel from "../models/rule";
import type TextProperty from "../models/text-property";
import { ComputedPropertyInfo, Priority } from "../models/text-property";

export interface DeclarationState {
  /** Array of the computed properties for a CSS declaration. */
  computedProperties: ComputedPropertyInfo[];
  /** An unique CSS declaration id. */
  id: string;
  /** Whether or not the declaration is valid. (Does it make sense for this value
   * to be assigned to this property name?) */
  isDeclarationValid: boolean;
  /** Whether or not the declaration is enabled. */
  isEnabled: boolean;
  /** Whether or not the declaration is invisible. In an inherited rule, only the
   * inherited declarations are shown and the rest are considered invisible. */
  isInvisible: boolean | null;
  /** Whether or not the declaration's property name is known. */
  isKnownProperty: boolean;
  /** Whether or not the property name is valid. */
  isNameValid: boolean;
  /** Whether or not the the declaration is overridden. */
  isOverridden: boolean;
  /** Whether or not the declaration is changed by the user. */
  isPropertyChanged: boolean;
  /** The declaration's property name. */
  name: string;
  /** The declaration's parsed property value. */
  parsedValue: (string | { type: string; value: string })[];
  /** The declaration's priority (either "important" or an empty string). */
  priority: Priority;
  /** The CSS rule id that is associated with this CSS declaration. */
  ruleId: string;
  /** The declaration's property value. */
  value: string;
}

export interface RuleState {
  /** Array of CSS declarations. */
  declarations: DeclarationState[];
  /** An unique CSS rule id. */
  id: string;
  /** An object containing information about the CSS rule's inheritance. */
  inheritance: RuleInheritance | null | undefined;
  /** Whether or not the rule does not match the current selected element. */
  isUnmatched: boolean;
  /* Whether or not the rule is an user agent style. */
  isUserAgentStyle: boolean | null;
  /** An object containing information about the CSS keyframes rules. */
  // keyframesRule: rule.keyframesRule,
  /** The pseudo-element keyword used in the rule. */
  pseudoElement: string;
  /** An object containing information about the CSS rule's selector. */
  selector: RuleSelector;
  /** An object containing information about the CSS rule's stylesheet source. */
  sourceLink: SourceLink;
  /** The type of CSS rule. */
  type: number;
}

export interface RulesState {
  rules: RuleState[] | undefined;
}

const initialState: RulesState = {
  // Array of CSS rules.
  rules: [],
};

const rulesSlice = createSlice({
  name: "rules",
  initialState,
  reducers: {
    rulesUpdated: {
      prepare(rules: RuleModel[] | null) {
        return {
          payload: rules?.map(rule => getRuleState(rule)) ?? [],
        };
      },
      reducer(state, action: PayloadAction<RuleState[]>) {
        state.rules = action.payload;
      },
    },
  },
});

export const { rulesUpdated } = rulesSlice.actions;

export default rulesSlice.reducer;

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

function getRuleState(rule: RuleModel): RuleState {
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

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createReducer, ReducerObject } from "../../shared/reducer-object";
import { RulesAction } from "../actions/rules";
import { RulesState } from "../state/rules";

const INITIAL_RULES: RulesState = {
  // The selector of the node that is highlighted by the selector highlighter.
  highlightedSelector: "",
  // Whether or not the add new rule button should be enabled.
  isAddRuleEnabled: false,
  // Array of CSS rules.
  rules: [],
};

const reducers: ReducerObject<RulesState, RulesAction> = {
  ["UPDATE_ADD_RULE_ENABLED"](rules, { enabled }) {
    return {
      ...rules,
      isAddRuleEnabled: enabled,
    };
  },

  ["UPDATE_HIGHLIGHTED_SELECTOR"](rules, { highlightedSelector }) {
    return {
      ...rules,
      highlightedSelector,
    };
  },

  ["UPDATE_RULES"](rules, { rules: newRules }) {
    return {
      ...rules,
      rules: newRules,
    };
  },

  ["UPDATE_SOURCE_LINK"](rules, { ruleId, sourceLink }) {
    return {
      highlightedSelector: rules.highlightedSelector,
      isAddRuleEnabled: rules.isAddRuleEnabled,
      rules: rules.rules?.map(rule => {
        if (rule.id !== ruleId) {
          return rule;
        }

        return {
          ...rule,
          sourceLink,
        };
      }),
    };
  },
};

export default createReducer(INITIAL_RULES, reducers);

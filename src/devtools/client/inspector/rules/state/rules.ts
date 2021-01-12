import { RuleInheritance, RuleSelector, SourceLink } from "../models/rule";
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
  parsedValue: string;
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
  highlightedSelector: string;
  isAddRuleEnabled: boolean;
  rules: RuleState[] | undefined;
}

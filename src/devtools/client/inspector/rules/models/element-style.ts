/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ProtocolClient } from "@replayio/protocol";

import { getObjectWithPreviewHelper } from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";
import RuleModel, { NodeWithId } from "devtools/client/inspector/rules/models/rule";
import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";
import { getAppliedRulesAsync } from "ui/suspense/styleCaches";

import { RuleFront } from "./fronts/rule";
import { StyleFront } from "./fronts/style";
import TextProperty, { ComputedProperty } from "./text-property";

const Services = require("devtools/shared/services");

var NON_ASCII = "[^\\x00-\\x7F]";
var ESCAPE = "\\\\[^\n\r]";
var FIRST_CHAR = ["[_a-z]", NON_ASCII, ESCAPE].join("|");
var TRAILING_CHAR = ["[_a-z0-9-]", NON_ASCII, ESCAPE].join("|");
var IS_VARIABLE_TOKEN = new RegExp(`^--(${FIRST_CHAR})(${TRAILING_CHAR})*$`, "i");

function isCssVariable(input: string) {
  return !!input.match(IS_VARIABLE_TOKEN);
}

const PREF_INACTIVE_CSS_ENABLED = "devtools.inspector.inactive.css.enabled";

/**
 * ElementStyle is responsible for the following:
 *   Keeps track of which properties are overridden.
 *   Maintains a list of Rule objects for a given element.
 */
export default class ElementStyle {
  /** The element whose style we're viewing */
  nodeId: string;
  pauseId: string;
  sessionId: string;
  replayClient: ReplayClientInterface;
  client: ProtocolClient;
  pseudoElements: string[];
  rules: RuleModel[] | null;
  variablesMap: Map<string, Map<string, string>>;
  destroyed?: boolean;

  private _unusedCssEnabled?: boolean;

  constructor(
    nodeId: string,
    pauseId: string,
    sessionId: string,
    replayClient: ReplayClientInterface,
    client: ProtocolClient
  ) {
    this.nodeId = nodeId;
    this.pauseId = pauseId;
    this.sessionId = sessionId;
    this.replayClient = replayClient;
    this.client = client;
    this.pseudoElements = [];
    this.rules = [];
    this.variablesMap = new Map<string, Map<string, string>>();
  }

  get unusedCssEnabled() {
    if (!this._unusedCssEnabled) {
      this._unusedCssEnabled = Services.prefs.getBoolPref(PREF_INACTIVE_CSS_ENABLED, false);
    }
    return this._unusedCssEnabled;
  }

  /**
   * Refresh the list of rules to be displayed for the active element.
   * Upon completion, this.rules[] will hold a list of Rule objects.
   *
   * Returns a promise that will be resolved when the elementStyle is
   * ready.
   */
  async populate() {
    this.rules = [];

    const nodeObject = await getObjectWithPreviewHelper(
      this.replayClient,
      this.pauseId,
      this.nodeId
    );
    const node = nodeObject?.preview?.node;

    if (!node) {
      return;
    }

    const wiredRules = await getAppliedRulesAsync(
      this.client,
      this.replayClient,
      this.sessionId,
      this.pauseId,
      this.nodeId
    );

    // Show rules applied to pseudo-elements first.
    for (const { rule, pseudoElement } of wiredRules) {
      if (pseudoElement) {
        this._maybeAddRule(rule, undefined, pseudoElement);
      }
    }

    // The inline rule has higher priority than applied rules.
    if (node.style) {
      const inlineStyleObject = await getObjectWithPreviewHelper(
        this.replayClient,
        this.pauseId,
        node.style
      );
      const styleFront = new StyleFront(inlineStyleObject);
      this._maybeAddRule(styleFront);
    }

    // Show rules applied directly to the element in priority order.
    for (const { rule, pseudoElement } of wiredRules) {
      if (!pseudoElement) {
        this._maybeAddRule(rule);
      }
    }

    let parentNodeId = node.parentNode;

    // Show relevant rules applied to parent elements.
    while (parentNodeId) {
      const nodeObject = await getObjectWithPreviewHelper(
        this.replayClient,
        this.pauseId,
        parentNodeId
      );
      const elem = nodeObject.preview?.node;
      if (!elem) {
        break;
      }
      const elemNodeWithId = { nodeId: parentNodeId, node: elem };

      if (elem.nodeType == Node.ELEMENT_NODE) {
        if (elem.style) {
          const styleObject = await getObjectWithPreviewHelper(
            this.replayClient,
            this.pauseId,
            elem.style!
          );
          const parentInline = new StyleFront(styleObject);
          if (parentInline.properties.length > 0) {
            this._maybeAddRule(parentInline, elemNodeWithId);
          }
        }

        const parentApplied = await getAppliedRulesAsync(
          this.client,
          this.replayClient,
          this.sessionId,
          this.pauseId,
          parentNodeId
        );

        if (parentApplied === null) {
          this.rules = null;
          return;
        }

        for (const { rule, pseudoElement } of parentApplied) {
          if (!pseudoElement) {
            this._maybeAddRule(rule, elemNodeWithId);
          }
        }
      }

      parentNodeId = elem.parentNode;
    }

    // Store a list of all pseudo-element types found in the matching rules.
    this.pseudoElements = this.rules.filter(r => r.pseudoElement).map(r => r.pseudoElement);

    // Mark overridden computed styles.
    this.onRuleUpdated();
  }

  /**
   * Returns the Rule object of the given rule id.
   *
   * @param  {String|null} id
   *         The id of the Rule object.
   * @return {RuleModel|undefined} of the given rule id or undefined if it cannot be found.
   */
  getRule(id: string | null) {
    return id ? this.rules?.find(rule => rule.domRule.objectId() === id) : undefined;
  }

  /**
   * Add a rule if it's one we care about. Filters out duplicates and
   * inherited styles with no inherited properties.
   *
   * @param  {RuleFront} ruleFront
   *         Rule to add.
   * @return {Boolean} true if we added the rule.
   */
  private _maybeAddRule(
    ruleFront: RuleFront | StyleFront,
    inherited?: NodeWithId,
    pseudoElement?: string
  ) {
    if (ruleFront.isSystem) {
      // We currently don't display any user agent styles.
      // See https://github.com/RecordReplay/devtools/issues/546
      return false;
    }

    this.rules?.push(new RuleModel(this, { rule: ruleFront, inherited, pseudoElement }));
    return true;
  }

  /**
   * Calls updateDeclarations with all supported pseudo elements
   */
  onRuleUpdated() {
    this.updateDeclarations();

    // Update declarations for matching rules for pseudo-elements.
    for (const pseudo of this.pseudoElements) {
      this.updateDeclarations(pseudo);
    }
  }

  /**
   * Go over all CSS rules matching the selected element and mark the CSS declarations
   * (aka TextProperty instances) with an `overridden` Boolean flag if an earlier or
   * higher priority declaration overrides it. Rules are already ordered by specificity.
   *
   * If a pseudo-element type is passed (ex: ::before, ::first-line, etc),
   * restrict the operation only to declarations in rules matching that pseudo-element.
   *
   * At the end, update the declaration's view (TextPropertyEditor instance) so it relects
   * the latest state. Use this opportunity to also trigger checks for the "inactive"
   * state of the declaration (whether it has effect or not).
   *
   * @param  {String} pseudo
   *         Optional pseudo-element for which to restrict marking CSS declarations as
   *         overridden.
   */
  updateDeclarations(pseudo = "") {
    // Gather all text properties applicable to the selected element or pseudo-element.
    const textProps = this._getDeclarations(pseudo);
    // Gather all the computed properties applied by those text properties.
    let computedProps: ComputedProperty[] = [];
    for (const textProp of textProps) {
      assert(textProp.computed, "TextProperty has no computed properties");
      computedProps = computedProps.concat(textProp.computed);
    }

    // CSS Variables inherits from the normal element in case of pseudo element.
    const variables = new Map<string, string>(pseudo ? this.variablesMap.get("") || [] : []);

    // Walk over the computed properties. As we see a property name
    // for the first time, mark that property's name as taken by this
    // property.
    //
    // If we come across a property whose name is already taken, check
    // its priority against the property that was found first:
    //
    //   If the new property is a higher priority, mark the old
    //   property overridden and mark the property name as taken by
    //   the new property.
    //
    //   If the new property is a lower or equal priority, mark it as
    //   overridden.
    //
    // _overriddenDirty will be set on each prop, indicating whether its
    // dirty status changed during this pass.
    const taken: Record<string, ComputedProperty> = {};
    for (const computedProp of computedProps) {
      const earlier = taken[computedProp.name];

      // Prevent -webkit-gradient from being selected after unchecking
      // linear-gradient in this case:
      //  -moz-linear-gradient: ...;
      //  -webkit-linear-gradient: ...;
      //  linear-gradient: ...;
      if (!computedProp.textProp.isValid()) {
        computedProp.overridden = true;
        continue;
      }

      let overridden;
      if (
        earlier &&
        computedProp.priority === "important" &&
        earlier.priority !== "important" &&
        (earlier.textProp.rule.inherited || !computedProp.textProp.rule.inherited)
      ) {
        // New property is higher priority. Mark the earlier property
        // overridden (which will reverse its dirty state).
        earlier._overriddenDirty = !earlier._overriddenDirty;
        earlier.overridden = true;
        overridden = false;
      } else {
        overridden = !!earlier;
      }

      computedProp._overriddenDirty = !!computedProp.overridden !== overridden;
      computedProp.overridden = overridden;

      if (!computedProp.overridden && computedProp.textProp.enabled) {
        taken[computedProp.name] = computedProp;

        if (isCssVariable(computedProp.name)) {
          variables.set(computedProp.name, computedProp.value);
        }
      }
    }

    // Find the CSS variables that have been updated.
    const previousVariablesMap = new Map<string, string>(this.variablesMap.get(pseudo) || []);
    const changedVariableNamesSet = new Set<string>(
      [...variables.keys(), ...previousVariablesMap.keys()].filter(
        k => variables.get(k) !== previousVariablesMap.get(k)
      )
    );

    this.variablesMap.set(pseudo, variables);

    // For each TextProperty, mark it overridden if all of its computed
    // properties are marked overridden. Update the text property's associated
    // editor, if any. This will clear the _overriddenDirty state on all
    // computed properties. For each editor we also show or hide the inactive
    // CSS icon as needed.
    for (const textProp of textProps) {
      // _updatePropertyOverridden will return true if the
      // overridden state has changed for the text property.
      // _hasUpdatedCSSVariable will return true if the declaration contains any
      // of the updated CSS variable names.
      // if (
      //   this._updatePropertyOverridden(textProp) ||
      //   this._hasUpdatedCSSVariable(textProp, changedVariableNamesSet)
      // ) {
      //   textProp.updateEditor();
      // }
      this._updatePropertyOverridden(textProp);

      // For each editor show or hide the inactive CSS icon as needed.
      // if (textProp.editor && this.unusedCssEnabled) {
      //   textProp.editor.updatePropertyState();
      // }
    }
  }

  /**
   * Returns true if the given declaration's property value contains a CSS variable
   * matching any of the updated CSS variable names.
   *
   * @param {TextProperty} declaration
   *        A TextProperty of a rule.
   * @param {Set<String>} variableNamesSet
   *        A Set of CSS variable names that have been updated.
   */
  private _hasUpdatedCSSVariable(declaration: TextProperty, variableNamesSet: Set<string>) {
    for (const variableName of variableNamesSet) {
      if (declaration.hasCSSVariable(variableName)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper for |this.updateDeclarations()| to mark CSS declarations as overridden.
   *
   * Returns an array of CSS declarations (aka TextProperty instances) from all rules
   * applicable to the selected element ordered from more- to less-specific.
   *
   * If a pseudo-element type is given, restrict the result only to declarations
   * applicable to that pseudo-element.
   *
   * NOTE: this method skips CSS declarations in @keyframes rules because a number of
   * criteria such as time and animation delay need to be checked in order to determine
   * if the property is overridden at runtime.
   *
   * @param  {String} pseudo
   *         Optional pseudo-element for which to restrict marking CSS declarations as
   *         overridden. If omitted, only declarations for regular style rules are
   *         returned (no pseudo-element style rules).
   *
   * @return {Array}
   *         Array of TextProperty instances.
   */
  private _getDeclarations(pseudo = "") {
    const textProps: TextProperty[] = [];

    for (const rule of this.rules || []) {
      // Skip @keyframes rules
      // if (rule.keyframes) {
      //   continue;
      // }

      // Style rules must be considered only when they have selectors that match the node.
      // When renaming a selector, the unmatched rule lingers in the Rule view, but it no
      // longer matches the node. This strict check avoids accidentally causing
      // declarations to be overridden in the remaining matching rules.
      const isStyleRule = rule.pseudoElement === ""; // && rule.matchedSelectors.length > 0;

      // Style rules for pseudo-elements must always be considered, regardless if their
      // selector matches the node. As a convenience, declarations in rules for
      // pseudo-elements show up in a separate Pseudo-elements accordion when selecting
      // the host node (instead of the pseudo-element node directly, which is sometimes
      // impossible, for example with ::selection or ::first-line).
      // Loosening the strict check on matched selectors ensures these declarations
      // participate in the algorithm below to mark them as overridden.
      const isPseudoElementRule = rule.pseudoElement !== "" && rule.pseudoElement === pseudo;

      const isElementStyle = !rule.domRule.isRule();

      const filterCondition = pseudo === "" ? isStyleRule || isElementStyle : isPseudoElementRule;

      // Collect all relevant CSS declarations (aka TextProperty instances).
      if (filterCondition) {
        for (const textProp of rule.textProps.slice(0).reverse()) {
          if (textProp.enabled) {
            textProps.push(textProp);
          }
        }
      }
    }

    return textProps;
  }

  /**
   * Mark a given TextProperty as overridden or not depending on the
   * state of its computed properties. Clears the _overriddenDirty state
   * on all computed properties.
   *
   * @param  {TextProperty} prop
   *         The text property to update.
   * @return {Boolean} true if the TextProperty's overridden state (or any of
   *         its computed properties overridden state) changed.
   */
  _updatePropertyOverridden(prop: TextProperty) {
    let overridden = true;
    let dirty = false;

    assert(prop.computed, "TextProperty has no computed properties");
    for (const computedProp of prop.computed) {
      if (!computedProp.overridden) {
        overridden = false;
      }

      dirty = computedProp._overriddenDirty || dirty;
      delete computedProp._overriddenDirty;
    }

    dirty = !!prop.overridden !== overridden || dirty;
    prop.overridden = overridden;
    return dirty;
  }

  /**
   * Returns the current value of a CSS variable; or null if the
   * variable is not defined.
   *
   * @param  {String} name
   *         The name of the variable.
   * @param  {String} pseudo
   *         The pseudo-element name of the rule.
   * @return {String} the variable's value or null if the variable is
   *         not defined.
   */
  getVariable(name: string, pseudo = "") {
    const variables = this.variablesMap.get(pseudo);
    return variables ? variables.get(name) : null;
  }
}

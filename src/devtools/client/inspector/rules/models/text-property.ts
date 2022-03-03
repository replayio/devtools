/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { generateUUID } = require("devtools/shared/generate-uuid");
const { hasCSSVariable } = require("devtools/client/inspector/rules/utils/utils");
const { escapeCSSComment } = require("devtools/shared/css/parsing-utils");
import Rule from "./rule";
import ElementStyle from "./element-style";
import CSSProperties from "../../css-properties";
import UserProperties from "./user-properties";
import { assert } from "protocol/utils";

export type Priority = "" | "important" | undefined;

export interface ComputedProperty {
  textProp: TextProperty;
  name: string;
  value: string;
  priority: Priority;
  overridden?: boolean;
  _overriddenDirty?: boolean;
}

export interface ComputedPropertyInfo {
  isOverridden: boolean;
  name: string;
  priority: Priority;
  value: string;
}

/**
 * TextProperty is responsible for the following:
 *   Manages a single property from the authoredText attribute of the
 *     relevant declaration.
 *   Maintains a list of computed properties that come from this
 *     property declaration.
 *   Changes to the TextProperty are sent to its related Rule for
 *     application.
 */
export default class TextProperty {
  id: string;
  rule: Rule;
  name: string;
  value: string;
  priority: Priority;
  enabled: boolean;
  invisible: boolean | null;
  elementStyle: ElementStyle;
  cssProperties: typeof CSSProperties;
  outputParser: any;
  panelDoc: Document | null;
  computed: ComputedProperty[] | undefined;
  overridden?: boolean;
  userProperties?: UserProperties;

  /**
   * @param {Rule} rule
   *        The rule this TextProperty came from.
   * @param {String} name
   *        The text property name (such as "background" or "border-top").
   * @param {String} value
   *        The property's value (not including priority).
   * @param {String} priority
   *        The property's priority (either "important" or an empty string).
   * @param {Boolean} enabled
   *        Whether the property is enabled.
   * @param {Boolean} invisible
   *        Whether the property is invisible. In an inherited rule, only show
   *        the inherited declarations. The other declarations are considered
   *        invisible and does not show up in the UI. These are needed so that
   *        the index of a property in Rule.textProps is the same as the index
   *        coming from parseDeclarations.
   */
  constructor(
    rule: Rule,
    name: string,
    value: string,
    priority: Priority,
    enabled = true,
    invisible: boolean | null = false
  ) {
    this.id = name + "_" + generateUUID().toString();
    this.rule = rule;
    this.name = name;
    this.value = value;
    this.priority = priority;
    this.enabled = !!enabled;
    this.invisible = invisible;
    this.elementStyle = this.rule.elementStyle;
    this.cssProperties = this.elementStyle.ruleView.cssProperties;
    this.outputParser = this.elementStyle.ruleView.outputParser;
    this.panelDoc = this.elementStyle.ruleView.inspector.panelDoc;
    this.userProperties = this.elementStyle.store.userProperties;

    this.updateComputed();
  }

  get computedProperties(): ComputedPropertyInfo[] {
    return this.computed!.filter(computed => computed.name !== this.name).map(computed => {
      return {
        isOverridden: !!computed.overridden,
        name: computed.name,
        priority: computed.priority,
        value: computed.value,
      };
    });
  }

  /**
   * Returns whether or not the declaration's name is known.
   *
   * @return {Boolean} true if the declaration name is known, false otherwise.
   */
  get isKnownProperty() {
    return this.cssProperties.isKnown(this.name);
  }

  /**
   * Returns whether or not the declaration is changed by the user.
   *
   * @return {Boolean} true if the declaration is changed by the user, false
   * otherwise.
   */
  get isPropertyChanged() {
    assert(this.userProperties, "TextProperty.userProperties not set");
    return this.userProperties.contains(this.rule.domRule, this.name);
  }

  /**
   * Returns the declaration's parsed property value.
   */
  get parsedValue() {
    let value = this.value;

    if (this.priority) {
      value += " !" + this.priority;
    }

    return this.outputParser.parseCssProperty(this.name, value, {
      baseURI: this.rule.ruleHref,
    });
  }

  /**
   * Update the editor associated with this text property,
   * if any.
   */
  updateEditor() {
    // if (this.editor) {
    //   this.editor.update();
    // }
  }

  /**
   * Update the list of computed properties for this text property.
   */
  updateComputed() {
    if (!this.name) {
      return;
    }

    // This is a bit funky.  To get the list of computed properties
    // for this text property, we'll set the property on a dummy element
    // and see what the computed style looks like.
    const dummyElement = this.elementStyle.ruleView.dummyElement;
    const dummyStyle = dummyElement.style;
    dummyStyle.cssText = "";
    dummyStyle.setProperty(this.name, this.value, this.priority);

    this.computed = [];

    // Manually get all the properties that are set when setting a value on
    // this.name and check the computed style on dummyElement for each one.
    // If we just read dummyStyle, it would skip properties when value === "".
    const subProps = this.cssProperties.getSubproperties(this.name);

    for (const prop of subProps) {
      this.computed.push({
        textProp: this,
        name: prop,
        value: dummyStyle.getPropertyValue(prop),
        priority: dummyStyle.getPropertyPriority(prop) as Priority,
      });
    }
  }

  /**
   * Set all the values from another TextProperty instance into
   * this TextProperty instance.
   *
   * @param {TextProperty} prop
   *        The other TextProperty instance.
   */
  // set(prop) {
  //   let changed = false;
  //   for (const item of ["name", "value", "priority", "enabled"]) {
  //     if (this[item] !== prop[item]) {
  //       this[item] = prop[item];
  //       changed = true;
  //     }
  //   }

  //   if (changed) {
  //     this.updateEditor();
  //   }
  // }

  // setValue(value, priority, force = false) {
  //   if (value !== this.value || force) {
  //     this.userProperties.setProperty(this.rule.domRule, this.name, value);
  //   }

  //   return this.rule.setPropertyValue(this, value, priority).then(() => this.updateEditor());
  // }

  /**
   * Called when the property's value has been updated externally, and
   * the property and editor should update to reflect that value.
   *
   * @param {String} value
   *        Property value
   */
  // updateValue(value) {
  //   if (value !== this.value) {
  //     this.value = value;
  //     this.updateEditor();
  //   }
  // }

  // async setName(name) {
  //   if (name !== this.name) {
  //     this.userProperties.setProperty(this.rule.domRule, name, this.value);
  //   }

  //   await this.rule.setPropertyName(this, name);
  //   this.updateEditor();
  // }

  // setEnabled(value) {
  //   this.rule.setPropertyEnabled(this, value);
  //   this.updateEditor();
  // }

  // remove() {
  //   this.rule.removeProperty(this);
  // }

  /**
   * Return a string representation of the rule property.
   */
  stringifyProperty() {
    // Get the displayed property value
    let declaration = this.name + ": " + this.value;

    if (this.priority) {
      declaration += " !" + this.priority;
    }

    declaration += ";";

    // Comment out property declarations that are not enabled
    if (!this.enabled) {
      declaration = "/* " + escapeCSSComment(declaration) + " */";
    }

    return declaration;
  }

  /**
   * Validate this property. Does it make sense for this value to be assigned
   * to this property name?
   *
   * @return {Boolean} true if the whole CSS declaration is valid, false otherwise.
   */
  isValid() {
    return true;
    /*
    const selfIndex = this.rule.textProps.indexOf(this);

    // When adding a new property in the rule-view, the TextProperty object is
    // created right away before the rule gets updated on the server, so we're
    // not going to find the corresponding declaration object yet. Default to
    // true.
    if (!this.rule.domRule.declarations[selfIndex]) {
      return true;
    }

    return this.rule.domRule.declarations[selfIndex].isValid;
    */
  }

  isUsed() {
    return { used: true };
    /*
    const selfIndex = this.rule.textProps.indexOf(this);
    const declarations = this.rule.domRule.declarations;

    // StyleRuleActor's declarations may have a isUsed flag (if the server is the right
    // version). Just return true if the information is missing.
    if (
      !declarations ||
      !declarations[selfIndex] ||
      !declarations[selfIndex].isUsed
    ) {
      return { used: true };
    }

    return declarations[selfIndex].isUsed;
    */
  }

  /**
   * Validate the name of this property.
   *
   * @return {Boolean} true if the property name is valid, false otherwise.
   */
  isNameValid() {
    return true;
    /*
    const selfIndex = this.rule.textProps.indexOf(this);

    // When adding a new property in the rule-view, the TextProperty object is
    // created right away before the rule gets updated on the server, so we're
    // not going to find the corresponding declaration object yet. Default to
    // true.
    if (!this.rule.domRule.declarations[selfIndex]) {
      return true;
    }

    return this.rule.domRule.declarations[selfIndex].isNameValid;
    */
  }

  /**
   * Returns true if the property value is a CSS variables and contains the given variable
   * name, and false otherwise.
   *
   * @param {String}
   *        CSS variable name (e.g. "--color")
   * @return {Boolean}
   */
  hasCSSVariable(name: string) {
    return hasCSSVariable(this.value, name);
  }
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Node } from "@replayio/protocol";

import TextProperty from "devtools/client/inspector/rules/models/text-property";
import { assert } from "protocol/utils";
import { isWindowsOS } from "shared/utils/os";
import { shortSource } from "third-party/css-logic/shared-inspector-css-logic";
import CSSProperties from "third-party/css/css-properties";
import { parseNamedDeclarations } from "third-party/css/parsing-utils";

import ElementStyle from "./element-style";
import { RuleFront } from "./fronts/rule";
import { StyleFront } from "./fronts/style";

export interface NodeWithId {
  nodeId: string;
  node: Node;
}

export interface RuleInheritance {
  // The object id for the element in which the rule is inherited from.
  inheritedNodeId: string;
  // The display name for the element in which the rule is inherited from.
  inheritedSource: string | undefined;
}

export interface RuleSelector {
  getUniqueSelector: () => Promise<string>;
  matchedSelectors: string[] | undefined;
  selectors: string[] | undefined;
  selectorText: string;
}

export interface SourceLink {
  label: string | null | undefined;
  title: string | null | undefined;
}

interface RuleOptions {
  rule: RuleFront | StyleFront;
  matchedSelectors?: string[];
  pseudoElement?: string;
  isSystem?: boolean;
  isUnmatched?: boolean;
  inherited?: NodeWithId | null;
}

interface SourceLocation {
  url: string | null | undefined;
  line: number | null | undefined;
  column: number | null | undefined;
}

/**
 * Rule is responsible for the following:
 *   Manages a single style declaration or rule.
 *   Applies changes to the properties in a rule.
 *   Maintains a list of TextProperty objects.
 */
export default class RuleModel {
  elementStyle: ElementStyle;
  domRule: RuleFront | StyleFront;
  matchedSelectors: string[];
  pseudoElement: string;
  isSystem: boolean | undefined;
  isUnmatched: boolean;
  inherited: NodeWithId | null;
  mediaText: string;
  textProps: TextProperty[];

  private _inheritedSource?: string;
  private _sourceLocation?: SourceLocation;

  /**
   * @param {ElementStyle} elementStyle
   *        The ElementStyle to which this rule belongs.
   * @param {Object} options
   *        The information used to construct this rule. Properties include:
   *          rule: A StyleRuleActor
   *          inherited: An element this rule was inherited from. If omitted,
   *            the rule applies directly to the current element.
   *          isSystem: Is this a user agent style?
   *          isUnmatched: True if the rule does not match the current selected
   *            element, otherwise, false.
   */
  constructor(elementStyle: ElementStyle, options: RuleOptions) {
    this.elementStyle = elementStyle;
    this.domRule = options.rule;
    this.matchedSelectors = options.matchedSelectors || [];
    this.pseudoElement = options.pseudoElement || "";
    this.isSystem = options.isSystem;
    this.isUnmatched = options.isUnmatched || false;
    this.inherited = options.inherited || null;

    this.mediaText = "";

    // Populate the text properties with the style's current authoredText value
    this.textProps = this._getTextProperties();

    this.getUniqueSelector = this.getUniqueSelector.bind(this);
  }

  destroy() {}

  get declarations() {
    return this.textProps;
  }

  /**
   * If this is an inherited rule, return an object containing information about the
   * element in which the rule is inherited from and the element source name to display.
   */
  get inheritance(): RuleInheritance | null {
    if (!this.inherited) {
      return null;
    }

    return {
      // The object id for the element in which the rule is inherited from.
      inheritedNodeId: this.inherited.nodeId,
      // The display name for the element in which the rule is inherited from.
      inheritedSource: this.inheritedSource,
    };
  }

  /**
   * If this is an inherited rule, return the display name for the element in which the
   * rule is inherited from.
   */
  get inheritedSource() {
    if (this._inheritedSource) {
      return this._inheritedSource;
    }
    this._inheritedSource = "";
    if (this.inherited) {
      let eltText = this.inherited.node.nodeName.toLowerCase();
      const idAttr = this.inherited.node.attributes?.find(attr => attr.name === "id");
      if (idAttr) {
        eltText += "#" + idAttr.value;
      }
      this._inheritedSource = `Inherited from ${eltText}`;
    }
    return this._inheritedSource;
  }

  get selector(): RuleSelector {
    return {
      getUniqueSelector: this.getUniqueSelector,
      matchedSelectors: this.matchedSelectors,
      selectors: this.domRule.selectors,
      selectorText: /* this.keyframes ? this.domRule.keyText : */ this.selectorText,
    };
  }

  get sourceLink(): SourceLink {
    return {
      label: this.getSourceText(shortSource({ href: this.sourceLocation.url })),
      title: this.sourceLocation.url,
    };
  }

  /**
   * Returns the original source location which includes the original URL, line and
   * column numbers.
   */
  get sourceLocation() {
    if (!this._sourceLocation) {
      this._sourceLocation = {
        column: this.ruleColumn,
        line: this.ruleLine,
        url: this.ruleHref,
      };
    }

    return this._sourceLocation;
  }

  get title() {
    let title = shortSource(this.sheet);
    if (this.domRule.isRule() && this.ruleLine !== undefined && this.ruleLine > 0) {
      title += ":" + this.ruleLine;
    }

    return title + (this.mediaText ? " @media " + this.mediaText : "");
  }

  get selectorText() {
    return this.domRule.selectors ? this.domRule.selectors.join(", ") : "element";
  }

  /**
   * The rule's stylesheet.
   */
  get sheet() {
    return this.domRule ? this.domRule.parentStyleSheet : null;
  }

  /**
   * The rule's URL, accounting for any source mapping.
   */
  get ruleHref() {
    return this.domRule ? this.domRule.href : null;
  }

  /**
   * The rule's line within a stylesheet, accounting for source mapping.
   */
  get ruleLine() {
    return this.domRule ? this.domRule.line : -1;
  }

  /**
   * The rule's column within a stylesheet, accounting for source mapping.
   */
  get ruleColumn() {
    return this.domRule ? this.domRule.column : null;
  }

  /**
   * Returns the TextProperty with the given id or undefined if it cannot be found.
   *
   * @param {String|null} id
   *        A TextProperty id.
   * @return {TextProperty|undefined} with the given id in the current Rule or undefined
   * if it cannot be found.
   */
  getDeclaration(id: string | null) {
    return id ? this.textProps.find(textProp => textProp.id === id) : undefined;
  }

  /**
   * Returns a formatted source text of the given stylesheet URL with its source line
   * and @media text.
   *
   * @param  {String} url
   *         The stylesheet URL.
   */
  getSourceText(url: string | null | undefined) {
    if (this.isSystem) {
      return `(user agent) ${this.title}`;
    }

    let sourceText = url;

    if (typeof this.sourceLocation.line === "number" && this.sourceLocation.line > 0) {
      sourceText += ":" + this.sourceLocation.line;
    }

    if (this.mediaText) {
      sourceText += " @media " + this.mediaText;
    }

    return sourceText;
  }

  /**
   * Returns an unique selector for the CSS rule.
   */
  async getUniqueSelector() {
    let selector = "";

    if (this.domRule.selectors) {
      // This is a style rule with a selector.
      selector = this.domRule.selectors.join(", ");
    }

    return selector;
  }

  /**
   * Returns true if the rule matches the creation options
   * specified.
   *
   * @param {Object} options
   *        Creation options. See the Rule constructor for documentation.
   */
  matches(options: RuleOptions) {
    return this.domRule === options.rule;
  }

  /**
   * Get the list of TextProperties from the style. Needs
   * to parse the style's authoredText.
   */
  _getTextProperties() {
    const textProps = [];

    assert(this.domRule.style, "domRule.style not set");
    const properties = parseNamedDeclarations(CSSProperties.isKnown, this.domRule.style.cssText);
    for (const prop of properties) {
      const name = prop.name;
      // In an inherited rule, we only show inherited properties.
      // However, we must keep all properties in order for rule
      // rewriting to work properly.  So, compute the "invisible"
      // property here.
      const invisible = this.inherited && !CSSProperties.isInherited(name);

      const textProp = new TextProperty(
        this,
        name,
        prop.value,
        prop.priority ? "important" : undefined,
        !("commentOffsets" in prop),
        invisible
      );
      textProps.push(textProp);
    }

    return textProps;
  }

  /**
   * Return a string representation of the rule.
   */
  stringifyRule() {
    const selectorText = this.selectorText;
    let cssText = "";
    const terminator = isWindowsOS() ? "\r\n" : "\n";

    for (const textProp of this.textProps) {
      if (!textProp.invisible) {
        cssText += "\t" + textProp.stringifyProperty() + terminator;
      }
    }

    return selectorText + " {" + terminator + cssText + "}";
  }

  /**
   * See whether this rule has any non-invisible properties.
   * @return {Boolean} true if there is any visible property, or false
   *         if all properties are invisible
   */
  hasAnyVisibleProperties() {
    for (const prop of this.textProps) {
      if (!prop.invisible) {
        return true;
      }
    }
    return false;
  }
}

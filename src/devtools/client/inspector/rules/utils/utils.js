/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import {
  VIEW_NODE_FONT_TYPE,
  VIEW_NODE_IMAGE_URL_TYPE,
  VIEW_NODE_INACTIVE_CSS,
  VIEW_NODE_LOCATION_TYPE,
  VIEW_NODE_PROPERTY_TYPE,
  VIEW_NODE_SELECTOR_TYPE,
  VIEW_NODE_SHAPE_POINT_TYPE,
  VIEW_NODE_SHAPE_SWATCH,
  VIEW_NODE_VALUE_TYPE,
  VIEW_NODE_VARIABLE_TYPE,
} from "devtools/client/inspector/shared/node-types";
const INSET_POINT_TYPES = ["top", "right", "bottom", "left"];

/**
 * Returns the [Rule] object associated with the given node.
 *
 * @param {DOMNode} node
 *        The node which we want to find the [Rule] object for
 * @param {ElementStyle} elementStyle
 *        The [ElementStyle] associated with the selected element
 * @return {Rule|null} associated with the given node
 */
export function getRuleFromNode(node, elementStyle) {
  const ruleEl = node.closest(".ruleview-rule[data-rule-id]");
  const ruleId = ruleEl ? ruleEl.dataset.ruleId : null;
  return ruleId ? elementStyle.getRule(ruleId) : null;
}

/**
 * Returns the [TextProperty] object associated with the given node.
 *
 * @param {DOMNode} node
 *        The node which we want to find the [TextProperty] object for
 * @param {Rule|null} rule
 *        The [Rule] associated with the given node
 * @return {TextProperty|null} associated with the given node
 */
function getDeclarationFromNode(node, rule) {
  if (!rule) {
    return null;
  }

  const declarationEl = node.closest(".ruleview-property[data-declaration-id]");
  const declarationId = declarationEl ? declarationEl.dataset.declarationId : null;
  return rule ? rule.getDeclaration(declarationId) : null;
}

/**
 * Get the type of a given node in the Rules view.
 *
 * @param {DOMNode} node
 *        The node which we want information about
 * @param {ElementStyle} elementStyle
 *        The ElementStyle to which this rule belongs
 * @return {Object|null} containing the following props:
 * - rule {Rule} The Rule object.
 * - type {String} One of the VIEW_NODE_XXX_TYPE const in
 *   client/inspector/shared/node-types.
 * - value {Object} Depends on the type of the node.
 * - view {String} Always "rule" to indicate the rule view.
 * Otherwise, returns null if the node isn't anything we care about.
 */
// eslint-disable-next-line complexity
export function getNodeInfo(node, elementStyle) {
  if (!node) {
    return null;
  }

  const rule = getRuleFromNode(node, elementStyle);
  const declaration = getDeclarationFromNode(node, rule);
  const classList = node.classList;

  let type, value;

  if (declaration && classList.contains("ruleview-propertyname")) {
    type = VIEW_NODE_PROPERTY_TYPE;
    value = {
      property: node.textContent,
      value: getPropertyNameAndValue(node).value,
      enabled: declaration.enabled,
      overridden: declaration.overridden,
      pseudoElement: rule.pseudoElement,
      sheetHref: rule.domRule.href,
      textProperty: declaration,
    };
  } else if (declaration && classList.contains("ruleview-propertyvalue")) {
    type = VIEW_NODE_VALUE_TYPE;
    value = {
      property: getPropertyNameAndValue(node).name,
      value: node.textContent,
      enabled: declaration.enabled,
      overridden: declaration.overridden,
      pseudoElement: rule.pseudoElement,
      sheetHref: rule.domRule.href,
      textProperty: declaration,
    };
  } else if (declaration && classList.contains("ruleview-font-family")) {
    const { name: propertyName, value: propertyValue } = getPropertyNameAndValue(node);
    type = VIEW_NODE_FONT_TYPE;
    value = {
      property: propertyName,
      value: propertyValue,
      enabled: declaration.enabled,
      overridden: declaration.overridden,
      pseudoElement: rule.pseudoElement,
      sheetHref: rule.domRule.href,
      textProperty: declaration,
    };
  } else if (declaration && classList.contains("ruleview-shape-point")) {
    type = VIEW_NODE_SHAPE_POINT_TYPE;
    value = {
      property: getPropertyNameAndValue(node).name,
      value: node.textContent,
      enabled: declaration.enabled,
      overridden: declaration.overridden,
      pseudoElement: rule.pseudoElement,
      sheetHref: rule.domRule.href,
      textProperty: declaration,
      toggleActive: getShapeToggleActive(node),
      point: getShapePoint(node),
    };
  } else if (declaration && classList.contains("ruleview-unused-warning")) {
    type = VIEW_NODE_INACTIVE_CSS;
    value = declaration.isUsed();
  } else if (declaration && classList.contains("ruleview-shapeswatch")) {
    type = VIEW_NODE_SHAPE_SWATCH;
    value = {
      enabled: declaration.enabled,
      overridden: declaration.overridden,
      textProperty: declaration,
    };
  } else if (
    declaration &&
    (classList.contains("ruleview-variable") || classList.contains("ruleview-unmatched-variable"))
  ) {
    type = VIEW_NODE_VARIABLE_TYPE;
    value = {
      property: getPropertyNameAndValue(node).name,
      value: node.textContent,
      enabled: declaration.enabled,
      overridden: declaration.overridden,
      pseudoElement: rule.pseudoElement,
      sheetHref: rule.domRule.href,
      textProperty: declaration,
      variable: node.dataset.variable,
    };
  } else if (
    declaration &&
    classList.contains("theme-link") &&
    !classList.contains("ruleview-rule-source")
  ) {
    type = VIEW_NODE_IMAGE_URL_TYPE;
    value = {
      property: getPropertyNameAndValue(node).name,
      value: node.parentNode.textContent,
      url: node.href,
      enabled: declaration.enabled,
      overridden: declaration.overridden,
      pseudoElement: rule.pseudoElement,
      sheetHref: rule.domRule.href,
      textProperty: declaration,
    };
  } else if (
    classList.contains("ruleview-selector-unmatched") ||
    classList.contains("ruleview-selector-matched") ||
    classList.contains("ruleview-selectorcontainer") ||
    classList.contains("ruleview-selector") ||
    classList.contains("ruleview-selector-attribute") ||
    classList.contains("ruleview-selector-pseudo-class") ||
    classList.contains("ruleview-selector-pseudo-class-lock")
  ) {
    type = VIEW_NODE_SELECTOR_TYPE;
    value = rule.selectorText;
  } else if (
    classList.contains("ruleview-rule-source") ||
    classList.contains("ruleview-rule-source-label")
  ) {
    type = VIEW_NODE_LOCATION_TYPE;
    value = rule.sheet && rule.sheet.href ? rule.sheet.href : rule.title;
  } else {
    return null;
  }

  return {
    rule,
    type,
    value,
    view: "rule",
  };
}

/**
 * Walk up the DOM from a given node until a parent property holder is found,
 * and return the textContent for the name and value nodes.
 * Stops at the first property found, so if node is inside the computed property
 * list, the computed property will be returned
 *
 * @param {DOMNode} node
 *        The node to start from
 * @return {Object} {name, value}
 */
function getPropertyNameAndValue(node) {
  while (node && node.classList) {
    // Check first for ruleview-computed since it's the deepest
    if (
      node.classList.contains("ruleview-computed") ||
      node.classList.contains("ruleview-property")
    ) {
      return {
        name: node.querySelector(".ruleview-propertyname").textContent,
        value: node.querySelector(".ruleview-propertyvalue").textContent,
      };
    }

    node = node.parentNode;
  }

  return null;
}

/**
 * Walk up the DOM from a given node until a parent property holder is found,
 * and return an active shape toggle if one exists.
 *
 * @param {DOMNode} node
 *        The node to start from
 * @returns {DOMNode} The active shape toggle node, if one exists.
 */
function getShapeToggleActive(node) {
  while (node && node.classList) {
    // Check first for ruleview-computed since it's the deepest
    if (
      node.classList.contains("ruleview-computed") ||
      node.classList.contains("ruleview-property")
    ) {
      return node.querySelector(".ruleview-shapeswatch.active");
    }

    node = node.parentNode;
  }

  return null;
}

/**
 * Get the point associated with a shape point node.
 *
 * @param {DOMNode} node
 *        A shape point node
 * @returns {String} The point associated with the given node.
 */
function getShapePoint(node) {
  const classList = node.classList;
  let point = node.dataset.point;
  // Inset points use classes instead of data because a single span can represent
  // multiple points.
  const insetClasses = [];
  classList.forEach(className => {
    if (INSET_POINT_TYPES.includes(className)) {
      insetClasses.push(className);
    }
  });
  if (insetClasses.length > 0) {
    point = insetClasses.join(",");
  }
  return point;
}

/**
 * Returns true if the given property value is a CSS variables and contains the given
 * variable name, and false otherwise.
 *
 * @param {String} propertyValue
 *        CSS property value (e.g. "var(--color)")
 * @param {String} variableName
 *        CSS variable name (e.g. "--color")
 * @return {Boolean}
 */
export function hasCSSVariable(propertyValue, variableName) {
  const regex = new RegExp(`(^|\\W)var\\(${variableName}\\s*[,)]`);
  return regex.test(propertyValue);
}

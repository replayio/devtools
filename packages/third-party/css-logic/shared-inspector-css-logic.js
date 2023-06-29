"use strict";

const MAX_DATA_URL_LENGTH = 40;

import { isWindowsOS } from "shared/utils/os";

/**
 * Special values for filter, in addition to an href these values can be used
 */
export const FILTER = {
  // show properties for all user style sheets.
  USER: "user",
  // USER, plus user-agent (i.e. browser) style sheets
  UA: "ua",
};

/**
 * Each rule has a status, the bigger the number, the better placed it is to
 * provide styling information.
 *
 * These statuses are localized inside the styleinspector.properties
 * string bundle.
 * @see csshtmltree.js RuleView._cacheStatusNames()
 */
export const STATUS = {
  BEST: 3,
  MATCHED: 2,
  PARENT_MATCH: 1,
  UNMATCHED: 0,
  UNKNOWN: -1,
};

/**
 * Mapping of CSSRule type value to CSSRule type name.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CSSRule
 */
export const CSSRuleTypeName = {
  1: "", // Regular CSS style rule has no name
  3: "@import",
  4: "@media",
  5: "@font-face",
  6: "@page",
  7: "@keyframes",
  8: "@keyframe",
  10: "@namespace",
  11: "@counter-style",
  12: "@supports",
  13: "@document",
  14: "@font-feature-values",
  15: "@viewport",
};

/**
 * Is the given property sheet an author stylesheet?
 *
 * @param {CSSStyleSheet} sheet a stylesheet
 * @return {boolean} true if the given stylesheet is an author stylesheet,
 * false otherwise.
 */
export const isAuthorStylesheet = function (sheet) {
  return sheet.parsingMode === "author";
};

/**
 * Is the given property sheet a user stylesheet?
 *
 * @param {CSSStyleSheet} sheet a stylesheet
 * @return {boolean} true if the given stylesheet is a user stylesheet,
 * false otherwise.
 */
export const isUserStylesheet = function (sheet) {
  return sheet.parsingMode === "user";
};

/**
 * Is the given property sheet a agent stylesheet?
 *
 * @param {CSSStyleSheet} sheet a stylesheet
 * @return {boolean} true if the given stylesheet is a agent stylesheet,
 * false otherwise.
 */
export const isAgentStylesheet = function (sheet) {
  return sheet.parsingMode === "agent";
};

/**
 * Return a shortened version of a style sheet's source.
 *
 * @param {CSSStyleSheet} sheet the DOM object for the style sheet.
 */
const shortSourceCache = new Map();
export const shortSource = function (sheet) {
  // Use a string like "inline" if there is no source href
  if (!sheet || !sheet.href) {
    return "inline";
  }

  if (shortSourceCache.has(sheet.href)) {
    return shortSourceCache.get(sheet.href);
  }

  const shortened = computeShortSource(sheet.href);
  shortSourceCache.set(sheet.href, shortened);
  return shortened;
};

function computeShortSource(href) {
  // If the sheet is a data URL, return a trimmed version of it.
  const dataUrl = href.trim().match(/^data:.*?,((?:.|\r|\n)*)$/);
  if (dataUrl) {
    return dataUrl[1].length > MAX_DATA_URL_LENGTH
      ? `${dataUrl[1].substr(0, MAX_DATA_URL_LENGTH - 1)}…`
      : dataUrl[1];
  }

  // We try, in turn, the filename, filePath, query string, whole thing
  let url = {};
  try {
    url = new URL(href);
  } catch (ex) {
    // Some UA-provided stylesheets are not valid URLs.
  }

  if (url.pathname) {
    const index = url.pathname.lastIndexOf("/");
    if (index !== -1 && index < url.pathname.length) {
      return url.pathname.slice(index + 1);
    }
    return url.pathname;
  }

  if (url.query) {
    return url.query;
  }

  return href;
}

const TAB_CHARS = "\t";
const SPACE_CHARS = " ";

function getLineCountInComments(text) {
  let count = 0;

  for (const comment of text.match(/\/\*(?:.|\n)*?\*\//gm) || []) {
    count += comment.split("\n").length + 1;
  }

  return count;
}

/**
 * Prettify minified CSS text.
 * This prettifies CSS code where there is no indentation in usual places while
 * keeping original indentation as-is elsewhere.
 *
 * Returns an object with the resulting prettified source and a list of mappings of
 * token positions between the original and the prettified source. Each single mapping
 * is an object that looks like this:
 *
 * {
 *  original: {line: {Number}, column: {Number}},
 *  generated: {line: {Number}, column: {Number}},
 * }
 *
 * @param  {String} text
 *         The CSS source to prettify.
 * @param  {Number} ruleCount
 *         The number of CSS rules expected in the CSS source.
 *
 * @return {Object}
 *         Object with the prettified source and source mappings.
 *          {
 *            result: {String}  // Prettified source
 *            mappings: {Array} // List of objects with mappings for lines and columns
 *                              // between the original source and prettified source
 *          }
 */
// eslint-disable-next-line complexity
export function prettifyCSS(text, ruleCount) {
  if (prettifyCSS.LINE_SEPARATOR == null) {
    prettifyCSS.LINE_SEPARATOR = isWindowsOS() ? "\r\n" : "\n";
  }

  // Stylesheets may start and end with HTML comment tags (possibly with whitespaces
  // before and after). Remove those first. Don't do anything there aren't any.
  const trimmed = text.trim();
  if (trimmed.startsWith("<!--")) {
    text = trimmed.replace(/^<!--/, "").replace(/-->$/, "").trim();
  }

  const originalText = text;
  text = text.trim();

  // don't attempt to prettify if there's more than one line per rule, excluding comments.
  const lineCount = text.split("\n").length - 1 - getLineCountInComments(text);
  if (ruleCount !== null && lineCount >= ruleCount) {
    return { result: originalText, mappings: [] };
  }

  // We reformat the text using a simple state machine.  The
  // reformatting preserves most of the input text, changing only
  // whitespace.  The rules are:
  //
  // * After a "{" or ";" symbol, ensure there is a newline and
  //   indentation before the next non-comment, non-whitespace token.
  // * Additionally after a "{" symbol, increase the indentation.
  // * A "}" symbol ensures there is a preceding newline, and
  //   decreases the indentation level.
  // * Ensure there is whitespace before a "{".
  //
  // This approach can be confused sometimes, but should do ok on a
  // minified file.
  let indent = "";
  let indentLevel = 0;
  const tokens = getCSSLexer(text);
  // List of mappings of token positions from original source to prettified source.
  const mappings = [];
  // Line and column offsets used to shift the token positions after prettyfication.
  let lineOffset = 0;
  let columnOffset = 0;
  let indentOffset = 0;
  let result = "";
  let pushbackToken = undefined;

  // A helper function that reads tokens, looking for the next
  // non-comment, non-whitespace token.  Comment and whitespace tokens
  // are appended to |result|.  If this encounters EOF, it returns
  // null.  Otherwise it returns the last whitespace token that was
  // seen.  This function also updates |pushbackToken|.
  const readUntilSignificantToken = () => {
    while (true) {
      const token = tokens.nextToken();
      if (!token || token.tokenType !== "whitespace") {
        pushbackToken = token;
        return token;
      }
      // Saw whitespace.  Before committing to it, check the next
      // token.
      const nextToken = tokens.nextToken();
      if (!nextToken || nextToken.tokenType !== "comment") {
        pushbackToken = nextToken;
        return token;
      }
      // Saw whitespace + comment.  Update the result and continue.
      result = result + text.substring(token.startOffset, nextToken.endOffset);
    }
  };

  // State variables for readUntilNewlineNeeded.
  //
  // Starting index of the accumulated tokens.
  let startIndex;
  // Ending index of the accumulated tokens.
  let endIndex;
  // True if any non-whitespace token was seen.
  let anyNonWS;
  // True if the terminating token is "}".
  let isCloseBrace;
  // True if the token just before the terminating token was
  // whitespace.
  let lastWasWS;
  // True if the current token is inside a CSS selector.
  let isInSelector = true;
  // True if the current token is inside an at-rule definition.
  let isInAtRuleDefinition = false;

  // A helper function that reads tokens until there is a reason to
  // insert a newline.  This updates the state variables as needed.
  // If this encounters EOF, it returns null.  Otherwise it returns
  // the final token read.  Note that if the returned token is "{",
  // then it will not be included in the computed start/end token
  // range.  This is used to handle whitespace insertion before a "{".
  const readUntilNewlineNeeded = () => {
    let token;
    while (true) {
      if (pushbackToken) {
        token = pushbackToken;
        pushbackToken = undefined;
      } else {
        token = tokens.nextToken();
      }
      if (!token) {
        endIndex = text.length;
        break;
      }

      const line = tokens.lineNumber;
      const column = tokens.columnNumber;
      mappings.push({
        original: {
          line,
          column,
        },
        generated: {
          line: lineOffset + line,
          column: columnOffset,
        },
      });
      // Shift the column offset for the next token by the current token's length.
      columnOffset += token.endOffset - token.startOffset;

      if (token.tokenType === "at") {
        isInAtRuleDefinition = true;
      }

      // A "}" symbol must be inserted later, to deal with indentation
      // and newline.
      if (token.tokenType === "symbol" && token.text === "}") {
        isInSelector = true;
        isCloseBrace = true;
        break;
      } else if (token.tokenType === "symbol" && token.text === "{") {
        if (isInAtRuleDefinition) {
          isInAtRuleDefinition = false;
        } else {
          isInSelector = false;
        }
        break;
      }

      if (token.tokenType !== "whitespace") {
        anyNonWS = true;
      }

      if (startIndex === undefined) {
        startIndex = token.startOffset;
      }
      endIndex = token.endOffset;

      if (token.tokenType === "symbol" && token.text === ";") {
        break;
      }

      if (
        token.tokenType === "symbol" &&
        token.text === "," &&
        isInSelector &&
        !isInAtRuleDefinition
      ) {
        break;
      }

      lastWasWS = token.tokenType === "whitespace";
    }
    return token;
  };

  while (true) {
    // Set the initial state.
    startIndex = undefined;
    endIndex = undefined;
    anyNonWS = false;
    isCloseBrace = false;
    lastWasWS = false;

    // Read tokens until we see a reason to insert a newline.
    let token = readUntilNewlineNeeded();

    // Append any saved up text to the result, applying indentation.
    if (startIndex !== undefined) {
      if (isCloseBrace && !anyNonWS) {
        // If we saw only whitespace followed by a "}", then we don't
        // need anything here.
      } else {
        result = result + indent + text.substring(startIndex, endIndex);
        if (isCloseBrace) {
          result += prettifyCSS.LINE_SEPARATOR;
          lineOffset = lineOffset + 1;
        }
      }
    }

    // Get preference of the user regarding what to use for indentation,
    // spaces or tabs.
    const tabPrefs = getTabPrefs();

    if (isCloseBrace) {
      // Even if the stylesheet contains extra closing braces, the indent level should
      // remain > 0.
      indentLevel = Math.max(0, indentLevel - 1);

      if (tabPrefs.indentWithTabs) {
        indent = TAB_CHARS.repeat(indentLevel);
        indentOffset = 4 * indentLevel;
      } else {
        indent = SPACE_CHARS.repeat(indentLevel);
        indentOffset = 1 * indentLevel;
      }
      result = result + indent + "}";
    }

    if (!token) {
      break;
    }

    if (token.tokenType === "symbol" && token.text === "{") {
      if (!lastWasWS) {
        result += " ";
        columnOffset++;
      }
      result += "{";
      if (tabPrefs.indentWithTabs) {
        indent = TAB_CHARS.repeat(++indentLevel);
        indentOffset = 4 * indentLevel;
      } else {
        indent = SPACE_CHARS.repeat(++indentLevel);
        indentOffset = 1 * indentLevel;
      }
    }

    // Now it is time to insert a newline.  However first we want to
    // deal with any trailing comments.
    token = readUntilSignificantToken();

    // "Early" bail-out if the text does not appear to be minified.
    // Here we ignore the case where whitespace appears at the end of
    // the text.
    if (
      pushbackToken &&
      token &&
      token.tokenType === "whitespace" &&
      /\n/g.test(text.substring(token.startOffset, token.endOffset))
    ) {
      return { result: originalText, mappings: [] };
    }

    // Finally time for that newline.
    result = result + prettifyCSS.LINE_SEPARATOR;

    // Update line and column offsets for the new line.
    lineOffset = lineOffset + 1;
    columnOffset = 0 + indentOffset;

    // Maybe we hit EOF.
    if (!pushbackToken) {
      break;
    }
  }

  return { result, mappings };
}


/**
 * Given a node, check to see if it is a ::marker, ::before, or ::after element.
 * If so, return the node that is accessible from within the document
 * (the parent of the anonymous node), along with which pseudo element
 * it was.  Otherwise, return the node itself.
 *
 * @returns {Object}
 *            - {DOMNode} node The non-anonymous node
 *            - {string} pseudo One of ':marker', ':before', ':after', or null.
 */
export function getBindingElementAndPseudo(node) {
  let bindingElement = node;
  let pseudo = null;
  if (node.nodeName == "_moz_generated_content_marker") {
    bindingElement = node.parentNode;
    pseudo = ":marker";
  } else if (node.nodeName == "_moz_generated_content_before") {
    bindingElement = node.parentNode;
    pseudo = ":before";
  } else if (node.nodeName == "_moz_generated_content_after") {
    bindingElement = node.parentNode;
    pseudo = ":after";
  }
  return {
    bindingElement: bindingElement,
    pseudo: pseudo,
  };
}

/**
 * Returns css style rules for a given a node.
 * This function can handle ::before or ::after pseudo element as well as
 * normal element.
 */
export function getCSSStyleRules(node) {
  const { bindingElement, pseudo } = getBindingElementAndPseudo(node);
  const rules = InspectorUtils.getCSSStyleRules(bindingElement, pseudo);
  return rules;
}

/**
 * Returns true if the given node has visited state.
 */
export function hasVisitedState(node) {
  if (!node) {
    return false;
  }

  const NS_EVENT_STATE_VISITED = 1 << 24;

  return (
    !!(InspectorUtils.getContentState(node) & NS_EVENT_STATE_VISITED) ||
    InspectorUtils.hasPseudoClassLock(node, ":visited")
  );
}

/**
 * Find the position of [element] in [nodeList].
 * @returns an index of the match, or -1 if there is no match
 */
function positionInNodeList(element, nodeList) {
  for (let i = 0; i < nodeList.length; i++) {
    if (element === nodeList[i]) {
      return i;
    }
  }
  return -1;
}

/**
 * For a provided node, find the appropriate container/node couple so that
 * container.contains(node) and a CSS selector can be created from the
 * container to the node.
 */
function findNodeAndContainer(node) {
  const shadowRoot = node.containingShadowRoot;
  while (node && node.isNativeAnonymous) {
    node = node.parentNode;
  }

  if (shadowRoot) {
    // If the node is under a shadow root, the shadowRoot contains the node and
    // we can find the node via shadowRoot.querySelector(path).
    return {
      containingDocOrShadow: shadowRoot,
      node,
    };
  }

  // Otherwise, get the root binding parent to get a non anonymous element that
  // will be accessible from the ownerDocument.
  return {
    containingDocOrShadow: node.ownerDocument,
    node,
  };
}

/**
 * Find a unique CSS selector for a given element
 * @returns a string such that:
 *   - ele.containingDocOrShadow.querySelector(reply) === ele
 *   - ele.containingDocOrShadow.querySelectorAll(reply).length === 1
 */
export const findCssSelector = function (ele) {
  const { node, containingDocOrShadow } = findNodeAndContainer(ele);
  ele = node;

  if (!containingDocOrShadow || !containingDocOrShadow.contains(ele)) {
    // findCssSelector received element not inside container.
    return "";
  }

  const cssEscape = ele.ownerGlobal.CSS.escape;

  // document.querySelectorAll("#id") returns multiple if elements share an ID
  if (ele.id && containingDocOrShadow.querySelectorAll("#" + cssEscape(ele.id)).length === 1) {
    return "#" + cssEscape(ele.id);
  }

  // Inherently unique by tag name
  const tagName = ele.localName;
  if (tagName === "html") {
    return "html";
  }
  if (tagName === "head") {
    return "head";
  }
  if (tagName === "body") {
    return "body";
  }

  // We might be able to find a unique class name
  let selector, index, matches;
  for (let i = 0; i < ele.classList.length; i++) {
    // Is this className unique by itself?
    selector = "." + cssEscape(ele.classList.item(i));
    matches = containingDocOrShadow.querySelectorAll(selector);
    if (matches.length === 1) {
      return selector;
    }
    // Maybe it's unique with a tag name?
    selector = cssEscape(tagName) + selector;
    matches = containingDocOrShadow.querySelectorAll(selector);
    if (matches.length === 1) {
      return selector;
    }
    // Maybe it's unique using a tag name and nth-child
    index = positionInNodeList(ele, ele.parentNode.children) + 1;
    selector = selector + ":nth-child(" + index + ")";
    matches = containingDocOrShadow.querySelectorAll(selector);
    if (matches.length === 1) {
      return selector;
    }
  }

  // Not unique enough yet.
  index = positionInNodeList(ele, ele.parentNode.children) + 1;
  selector = cssEscape(tagName) + ":nth-child(" + index + ")";
  if (ele.parentNode !== containingDocOrShadow) {
    selector = findCssSelector(ele.parentNode) + " > " + selector;
  }
  return selector;
};

/**
 * If the element is in a frame or under a shadowRoot, return the corresponding
 * element.
 */
function getSelectorParent(node) {
  const shadowRoot = node.containingShadowRoot;
  if (shadowRoot) {
    // The element is in a shadowRoot, return the host component.
    return shadowRoot.host;
  }

  // Otherwise return the parent frameElement.
  return node.ownerGlobal.frameElement;
}

/**
 * Retrieve the array of CSS selectors corresponding to the provided node.
 *
 * The selectors are ordered starting with the root document and ending with the deepest
 * nested frame. Additional items are used if the node is inside a frame or a shadow root,
 * each representing the CSS selector for finding the frame or root element in its parent
 * document.
 *
 * This format is expected by DevTools in order to handle the Inspect Node context menu
 * item.
 *
 * @param  {node}
 *         The node for which the CSS selectors should be computed
 * @return {Array}
 *         An array of CSS selectors to find the target node. Several selectors can be
 *         needed if the element is nested in frames and not directly in the root
 *         document. The selectors are ordered starting with the root document and
 *         ending with the deepest nested frame or shadow root.
 */
export const findAllCssSelectors = function (node) {
  const selectors = [];
  while (node) {
    selectors.unshift(findCssSelector(node));
    node = getSelectorParent(node);
  }

  return selectors;
};

/**
 * Get the full CSS path for a given element.
 *
 * @returns a string that can be used as a CSS selector for the element. It might not
 * match the element uniquely. It does however, represent the full path from the root
 * node to the element.
 */
export function getCssPath(ele) {
  const { node, containingDocOrShadow } = findNodeAndContainer(ele);
  ele = node;
  if (!containingDocOrShadow || !containingDocOrShadow.contains(ele)) {
    // getCssPath received element not inside container.
    return "";
  }

  const nodeGlobal = ele.ownerGlobal.Node;

  const getElementSelector = element => {
    if (!element.localName) {
      return "";
    }

    let label =
      element.nodeName == element.nodeName.toUpperCase()
        ? element.localName.toLowerCase()
        : element.localName;

    if (element.id) {
      label += "#" + element.id;
    }

    if (element.classList) {
      for (const cl of element.classList) {
        label += "." + cl;
      }
    }

    return label;
  };

  const paths = [];

  while (ele) {
    if (!ele || ele.nodeType !== nodeGlobal.ELEMENT_NODE) {
      break;
    }

    paths.splice(0, 0, getElementSelector(ele));
    ele = ele.parentNode;
  }

  return paths.length ? paths.join(" ") : "";
}

/**
 * Get the xpath for a given element.
 *
 * @param {DomNode} ele
 * @returns a string that can be used as an XPath to find the element uniquely.
 */
export function getXPath(ele) {
  const { node, containingDocOrShadow } = findNodeAndContainer(ele);
  ele = node;
  if (!containingDocOrShadow || !containingDocOrShadow.contains(ele)) {
    // getXPath received element not inside container.
    return "";
  }

  // Create a short XPath for elements with IDs.
  if (ele.id) {
    return `//*[@id="${ele.id}"]`;
  }

  // Otherwise walk the DOM up and create a part for each ancestor.
  const parts = [];

  const nodeGlobal = ele.ownerGlobal.Node;
  // Use nodeName (instead of localName) so namespace prefix is included (if any).
  while (ele && ele.nodeType === nodeGlobal.ELEMENT_NODE) {
    let nbOfPreviousSiblings = 0;
    let hasNextSiblings = false;

    // Count how many previous same-name siblings the element has.
    let sibling = ele.previousSibling;
    while (sibling) {
      // Ignore document type declaration.
      if (sibling.nodeType !== nodeGlobal.DOCUMENT_TYPE_NODE && sibling.nodeName == ele.nodeName) {
        nbOfPreviousSiblings++;
      }

      sibling = sibling.previousSibling;
    }

    // Check if the element has at least 1 next same-name sibling.
    sibling = ele.nextSibling;
    while (sibling) {
      if (sibling.nodeName == ele.nodeName) {
        hasNextSiblings = true;
        break;
      }
      sibling = sibling.nextSibling;
    }

    const prefix = ele.prefix ? ele.prefix + ":" : "";
    const nth = nbOfPreviousSiblings || hasNextSiblings ? `[${nbOfPreviousSiblings + 1}]` : "";

    parts.push(prefix + ele.localName + nth);

    ele = ele.parentNode;
  }

  return parts.length ? "/" + parts.reverse().join("/") : "";
}

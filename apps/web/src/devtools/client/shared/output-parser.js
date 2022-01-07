/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("devtools/shared/services");
const { angleUtils } = require("devtools/client/shared/css-angle");
const { colorUtils } = require("devtools/shared/css/color");
const { getCSSLexer } = require("devtools/shared/css/lexer");

// Functions that accept an angle argument.
const ANGLE_TAKING_FUNCTIONS = [
  "linear-gradient",
  "-moz-linear-gradient",
  "repeating-linear-gradient",
  "-moz-repeating-linear-gradient",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "rotate3d",
  "skew",
  "skewX",
  "skewY",
  "hue-rotate",
];
// All CSS timing-function values.
const TIMING_FUNCTION_VALUES = ["linear", "ease-in-out", "ease-in", "ease-out", "ease"];
// Functions that accept a color argument.
const COLOR_TAKING_FUNCTIONS = [
  "linear-gradient",
  "-moz-linear-gradient",
  "repeating-linear-gradient",
  "-moz-repeating-linear-gradient",
  "radial-gradient",
  "-moz-radial-gradient",
  "repeating-radial-gradient",
  "-moz-repeating-radial-gradient",
  "drop-shadow",
];

const ANGLE = (exports.ANGLE = "angle");
const COLOR = (exports.COLOR = "color");
const CUSTOM_PROPERTY = (exports.CUSTOM_PROPERTY = "custom-property");
const FLEX = (exports.FLEX = "flex");
const FONT_FAMILY = (exports.FONT_FAMILY = "font-family");
const GRID = (exports.GRID = "grid");
const TIMING_FUNCTION = (exports.TIMING_FUNCTION = "timing-function");
const URI = (exports.URI = "url");
const VARIABLE_FUNCTION = (exports.VARIABLE_FUNCTION = "variable-function");

/**
 * This module is used to process CSS text declarations and output DOM fragments (to be
 * appended to panels in DevTools) for CSS values decorated with additional UI and
 * functionality.
 *
 * For example:
 * - attaching swatches for values instrumented with specialized tools: colors, timing
 * functions (cubic-bezier), filters, shapes, display values (flex/grid), etc.
 * - adding previews where possible (images, fonts, CSS transforms).
 * - converting between color types on Shift+click on their swatches.
 *
 * Usage:
 *   const OutputParser = require("devtools/client/shared/output-parser");
 *   const parser = new OutputParser(document, cssProperties);
 *   parser.parseCssProperty("color", "red"); // Returns document fragment.
 *
 * @param {Document} document
 *        Used to create DOM nodes.
 * @param {Object} cssProperties
 *        Instance of CssProperties, an object which provides an interface for
 *        working with the database of supported CSS properties and values.
 *        Two items are of interest from this object:
 *        - supportsTypes - A function that returns a boolean when asked if a css
 *          property name supports a given css type.  The function is
 *          executed like supportsType("color", "timing-function")
 *        - supportsCssColor4ColorFunction - A function for checking
 *          the supporting of css-color-4 color function.
 */
function OutputParser(document, { supportsType, supportsCssColor4ColorFunction }) {
  this.parsed = [];
  this.doc = document;
  this.supportsType = supportsType;

  this.cssColor4 = supportsCssColor4ColorFunction();
}

OutputParser.prototype = {
  /**
   * Parse a CSS property value given a property name.
   *
   * @param  {String} name
   *         CSS Property Name
   * @param  {String} value
   *         CSS Property value
   * @param  {Object} [options]
   *         Optional options object.
   * @return {Array<Object|String>}
   *         An array containing a mix of objects and plain strings. The object contains
   *         parsed information about the type and value.
   */
  parseCssProperty: function (name, value, options = {}) {
    this.parsed = [];

    this.options = {
      // A string used to resolve relative links.
      baseURI: null,
      // Convert colors to the default type selected in the options panel.
      defaultColorType: true,
      // A special case for parsing a "filter" property, causing the parser to skip the
      // wrapping the "filter" property. Used only for previewing with the filter swatch.
      filterSwatch: false,
      // expectTimingFunction: this.supportsType(name, "timing-function"),
      expectDisplay: name === "display",
      // expectFilter: name === "filter" || name === "backdrop-filter",
      // expectShape: name === "clip-path" || name === "shape-outside",
      expectFont: name === "font-family",
      supportsColor:
        this.supportsType(name, "color") ||
        this.supportsType(name, "gradient") ||
        (name.startsWith("--") && colorUtils.isValidCSSColor(value)),
    };

    // The filter property is special in that we want to show the
    // swatch even if the value is invalid, because this way the user
    // can easily use the editor to fix it.
    if (this.options.expectFilter || this._cssPropertySupportsValue(name, value)) {
      value = value.trim();
      const tokenStream = getCSSLexer(value);
      return this._doParse(value, tokenStream, false);
    }

    this._appendText(value);

    return this.parsed;
  },

  /**
   * Read tokens from |tokenStream| and collect all the (non-comment)
   * text. Return the collected texts and variable data (if any).
   * Stop when an unmatched closing paren is seen.
   * If |stopAtComma| is true, then also stop when a top-level
   * (unparenthesized) comma is seen.
   *
   * @param  {String} text
   *         The original source text.
   * @param  {CSSLexer} tokenStream
   *         The token stream from which to read.
   * @param  {Boolean} stopAtComma
   *         If true, stop at a comma.
   * @return {Object}
   *         An object of the form {tokens, functionData, sawComma, sawVariable}.
   *         |tokens| is a list of the non-comment, non-whitespace tokens
   *         that were seen. The stopping token (paren or comma) will not
   *         be included.
   *         |functionData| is a list of parsed strings and nodes that contain the
   *         data between the matching parenthesis. The stopping token's text will
   *         not be included.
   *         |sawComma| is true if the stop was due to a comma, or false otherwise.
   *         |sawVariable| is true if a variable was seen while parsing the text.
   */
  _parseMatchingParens: function (text, tokenStream, stopAtComma = false) {
    let depth = 1;
    const functionData = [];
    const tokens = [];
    let sawVariable = false;

    while (depth > 0) {
      const token = tokenStream.nextToken();
      if (!token) {
        break;
      }
      if (token.tokenType === "comment") {
        continue;
      }

      if (token.tokenType === "symbol") {
        if (stopAtComma && depth === 1 && token.text === ",") {
          return { tokens, functionData, sawComma: true, sawVariable };
        } else if (token.text === "(") {
          ++depth;
        } else if (token.text === ")") {
          --depth;
          if (depth === 0) {
            break;
          }
        }
        // } else if (token.tokenType === "function" && token.text === "var") {
        //   sawVariable = true;
        //   functionData.push(this._parseVariable(token, text, tokenStream));
      } else if (token.tokenType === "function") {
        ++depth;
      }

      if (token.tokenType !== "function" || token.text !== "var") {
        functionData.push(text.substring(token.startOffset, token.endOffset));
      }

      if (token.tokenType !== "whitespace") {
        tokens.push(token);
      }
    }

    return { tokens, functionData, sawComma: false, sawVariable };
  },

  /**
   * Parse var() use and return a variable node to be added to the output state.
   * This will read tokens up to and including the ")" that closes the "var("
   * invocation.
   *
   * @param  {CSSToken} initialToken
   *         The "var(" token that was already seen.
   * @param  {String} text
   *         The original input text.
   * @param  {CSSLexer} tokenStream
   *         The token stream from which to read.
   * @return {Object}
   *         An object containing the parsed values within the var() function.
   */
  _parseVariable: function (initialToken, text, tokenStream) {
    const result = {
      type: VARIABLE_FUNCTION,
      // Arguments within the var() function will be parsed and appended to `values`.
      // This could include an object with `type: CUSTOM_PROPERTY` to indicate a
      // custom property, a string such as a comma or property value, and nested objects
      // representing nested var() functions within the var() function.
      values: [],
    };

    // Handle the "var(".
    result.values.push(text.substring(initialToken.startOffset, initialToken.endOffset));

    // Parse the first argument within the parens of var().
    const { functionData, sawComma } = this._parseMatchingParens(text, tokenStream, true);
    const firstArgument = functionData[0];

    if (firstArgument.startsWith("--")) {
      result.values.push({
        type: CUSTOM_PROPERTY,
        value: firstArgument,
      });
    } else {
      // The first argument is not a custom property, append the argument into the
      // array of values.
      result.values.push(firstArgument);
    }

    // If we saw a ",", then append it and show the remainder using
    // the correct highlighting.
    if (sawComma) {
      result.values.push(",");

      // Parse the text up until the close paren, being sure to disable the special case
      // for filter. The remaining text could be CSS property values, custom properties
      // or nested var() functions. We send the remaining text through the main parser
      // `_doParse`.
      const savedExpectFilter = this.options.expectFilter;
      const saveParsed = this.parsed;
      this.options.expectFilter = false;
      this.parsed = [];
      result.values.push(...this._doParse(text, tokenStream, true));
      this.options.expectFilter = savedExpectFilter;
      this.parsed = saveParsed;
    }

    result.values.push(")");
    return result;
  },

  /**
   * The workhorse for @see _parse. This parses some CSS text,
   * stopping at EOF; or optionally when an umatched close paren is
   * seen.
   *
   * @param  {String} text
   *         The original input text.
   * @param  {CSSLexer} tokenStream
   *         The token stream from which to read
   * @param  {Boolean} stopAtCloseParen
   *         If true, stop at an umatched close paren.
   * @return {Array<Object|String>}
   *         An array containing a mix of objects and plain strings. The object contains
   *         parsed information about the type and value.
   */
  // eslint-disable-next-line complexity
  _doParse: function (text, tokenStream, stopAtCloseParen) {
    let parenDepth = stopAtCloseParen ? 1 : 0;
    let outerMostFunctionTakesColor = false;
    let fontFamilyNameParts = [];
    let previousWasBang = false;

    const colorOK = () => {
      return (
        this.options.supportsColor ||
        (this.options.expectFilter && parenDepth === 1 && outerMostFunctionTakesColor)
      );
    };

    const angleOK = function (angle) {
      return new angleUtils.CssAngle(angle).valid;
    };

    let spaceNeeded = false;
    let done = false;

    while (!done) {
      const token = tokenStream.nextToken();
      if (!token) {
        if (this.options.expectFont && fontFamilyNameParts.length !== 0) {
          this._appendFontFamily(fontFamilyNameParts.join(""));
        }
        break;
      }

      if (token.tokenType === "comment") {
        // This doesn't change spaceNeeded, because we didn't emit
        // anything to the output.
        continue;
      }

      switch (token.tokenType) {
        case "function": {
          if (
            COLOR_TAKING_FUNCTIONS.includes(token.text) ||
            ANGLE_TAKING_FUNCTIONS.includes(token.text)
          ) {
            // The function can accept a color or an angle argument, and we know
            // it isn't special in some other way. So, we let it
            // through to the ordinary parsing loop so that the value
            // can be handled in a single place.
            this._appendText(text.substring(token.startOffset, token.endOffset));
            if (parenDepth === 0) {
              outerMostFunctionTakesColor = COLOR_TAKING_FUNCTIONS.includes(token.text);
            }
            ++parenDepth;
            // } else if (token.text === "var") {
            //   this.parsed.push(this._parseVariable(token, text, tokenStream));
          } else {
            const { functionData, sawVariable } = this._parseMatchingParens(text, tokenStream);

            const functionName = text.substring(token.startOffset, token.endOffset);

            if (sawVariable) {
              // If function contains variable, we need to add both strings
              // and nodes.
              this._appendText(functionName);
              for (const data of functionData) {
                if (typeof data === "string") {
                  this._appendText(data);
                } else if (data) {
                  this.parsed.push(data);
                }
              }
              this._appendText(")");
            } else {
              // If no variable in function, join the text together and add
              // to DOM accordingly.
              const functionText = functionName + functionData.join("") + ")";

              if (this.options.expectTimingFunction && token.text === "cubic-bezier") {
                this.parsed.push({
                  type: TIMING_FUNCTION,
                  value: functionText,
                });
              } else if (colorOK() && colorUtils.isValidCSSColor(functionText, this.cssColor4)) {
                this._appendColor(functionText);
              } else {
                this._appendText(functionText);
              }
            }
          }
          break;
        }

        case "ident":
          if (this.options.expectTimingFunction && TIMING_FUNCTION_VALUES.includes(token.text)) {
            this.parsed.push({
              type: TIMING_FUNCTION,
              value: token.text,
            });
          } else if (this._isDisplayFlex(token)) {
            this.parsed.push({
              type: FLEX,
              value: token.text,
            });
          } else if (this._isDisplayGrid(token)) {
            this.parsed.push({
              type: GRID,
              value: token.text,
            });
          } else if (colorOK() && colorUtils.isValidCSSColor(token.text, this.cssColor4)) {
            this._appendColor(token.text);
            // } else if (angleOK(token.text)) {
            //   this._appendAngle(token.text);
          } else if (this.options.expectFont && !previousWasBang) {
            // We don't append the identifier if the previous token
            // was equal to '!', since in that case we expect the
            // identifier to be equal to 'important'.
            fontFamilyNameParts.push(token.text);
          } else {
            this._appendText(text.substring(token.startOffset, token.endOffset));
          }
          break;

        case "id":
        case "hash": {
          const original = text.substring(token.startOffset, token.endOffset);
          if (colorOK() && colorUtils.isValidCSSColor(original, this.cssColor4)) {
            if (spaceNeeded) {
              // Insert a space to prevent token pasting when a #xxx
              // color is changed to something like rgb(...).
              this._appendText(" ");
            }
            this._appendColor(original);
          } else {
            this._appendText(original);
          }
          break;
        }
        case "dimension":
          const value = text.substring(token.startOffset, token.endOffset);
          // if (angleOK(value)) {
          //   this._appendAngle(value);
          // } else {
          this._appendText(value);
          // }
          break;
        case "url":
        case "bad_url":
          this._appendURL(text.substring(token.startOffset, token.endOffset), token.text);
          break;

        case "string":
          if (this.options.expectFont) {
            fontFamilyNameParts.push(text.substring(token.startOffset, token.endOffset));
          } else {
            this._appendText(text.substring(token.startOffset, token.endOffset));
          }
          break;

        case "whitespace":
          if (this.options.expectFont) {
            fontFamilyNameParts.push(" ");
          } else {
            this._appendText(text.substring(token.startOffset, token.endOffset));
          }
          break;

        case "symbol":
          if (token.text === "(") {
            ++parenDepth;
          } else if (token.text === ")") {
            --parenDepth;

            if (stopAtCloseParen && parenDepth === 0) {
              done = true;
              break;
            }

            if (parenDepth === 0) {
              outerMostFunctionTakesColor = false;
            }
          } else if (
            (token.text === "," || token.text === "!") &&
            this.options.expectFont &&
            fontFamilyNameParts.length !== 0
          ) {
            this._appendFontFamily(fontFamilyNameParts.join(""));
            fontFamilyNameParts = [];
          }
        // falls through
        default:
          this._appendText(text.substring(token.startOffset, token.endOffset));
          break;
      }

      // If this token might possibly introduce token pasting when
      // color-cycling, require a space.
      spaceNeeded =
        token.tokenType === "ident" ||
        token.tokenType === "at" ||
        token.tokenType === "id" ||
        token.tokenType === "hash" ||
        token.tokenType === "number" ||
        token.tokenType === "dimension" ||
        token.tokenType === "percentage" ||
        token.tokenType === "dimension";
      previousWasBang = token.tokenType === "symbol" && token.text === "!";
    }

    let result = this.parsed;

    // if (this.options.expectFilter && !this.options.filterSwatch) {
    //   result = [{ type: FILTER, values: result }];
    // }

    return result;
  },

  /**
   * Returns true if it's a "display: [inline-]flex" token.
   *
   * @param  {Object} token
   *         The parsed token.
   */
  _isDisplayFlex: function (token) {
    return this.options.expectDisplay && (token.text === "flex" || token.text === "inline-flex");
  },

  /**
   * Returns true if it's a "display: [inline-]grid" token.
   *
   * @param  {Object} token
   *         The parsed token.
   */
  _isDisplayGrid: function (token) {
    return this.options.expectDisplay && (token.text === "grid" || token.text === "inline-grid");
  },

  /**
   * Append an angle value to the output.
   *
   * @param {String} angle
   *        Angle to append.
   */
  _appendAngle: function (angle) {
    const angleObj = new angleUtils.CssAngle(angle);
    this.parsed.push({
      type: ANGLE,
      angleObj,
      value: angleObj.toString(),
    });
  },

  /**
   * Check if a CSS property supports a specific value.
   *
   * @param  {String} name
   *         CSS Property name to check
   * @param  {String} value
   *         CSS Property value to check
   */
  _cssPropertySupportsValue: function (name, value) {
    // Checking pair as a CSS declaration string to account for "!important" in value.
    const declaration = `${name}:${value}`;
    return this.doc.defaultView.CSS.supports(declaration);
  },

  /**
   * Append a color to the output.
   *
   * @param  {String} color
   *         Color to append
   */
  _appendColor: function (color) {
    const colorObj = new colorUtils.CssColor(color, this.cssColor4);

    // A color is valid if it's really a color and not any of the CssColor SPECIAL_VALUES
    // except transparent.
    if (colorObj.valid && (!colorObj.specialValue || colorObj.specialValue === "transparent")) {
      if (!this.options.defaultColorType) {
        // If we're not being asked to convert the color to the default color type
        // specified by the user, then force the CssColor instance to be set to the type
        // of the current color.
        // Not having a type means that the default color type will be automatically used.
        colorObj.colorUnit = colorUtils.classifyColor(color);
      }

      this.parsed.push({
        colorObj,
        type: COLOR,
        value: colorObj.toString(),
      });
    } else {
      this._appendText(color);
    }
  },

  /**
   * A helper function that sanitizes a possibly-unterminated URL.
   */
  _sanitizeURL: function (url) {
    // Re-lex the URL and add any needed termination characters.
    const urlTokenizer = getCSSLexer(url);
    // Just read until EOF; there will only be a single token.
    while (urlTokenizer.nextToken()) {
      // Nothing.
    }

    return urlTokenizer.performEOFFixup(url, true);
  },

  /**
   * Append a URL to the output.
   *
   * @param  {String} match
   *         Complete match that may include "url(xxx)"
   * @param  {String} url
   *         Actual URL
   */
  _appendURL: function (match, url) {
    // Sanitize the URL.  Note that if we modify the URL, we just
    // leave the termination characters.  This isn't strictly
    // "as-authored", but it makes a bit more sense.
    match = this._sanitizeURL(match);
    // This regexp matches a URL token.  It puts the "url(", any
    // leading whitespace, and any opening quote into |leader|; the
    // URL text itself into |body|, and any trailing quote, trailing
    // whitespace, and the ")" into |trailer|.  We considered adding
    // functionality for this to CSSLexer, in some way, but this
    // seemed simpler on the whole.
    const urlParts = /^(url\([ \t\r\n\f]*(["']?))(.*?)(\2[ \t\r\n\f]*\))$/i.exec(match);

    // Bail out if that didn't match anything.
    if (!urlParts) {
      this._appendText(match);
      return;
    }

    const [, leader, , body, trailer] = urlParts;

    this._appendText(leader);

    let href = url;
    if (this.options.baseURI) {
      try {
        href = new URL(url, this.options.baseURI).href;
      } catch (e) {
        // Ignore.
      }
    }

    this.parsed.push({
      type: URI,
      href,
      value: body,
    });

    this._appendText(trailer);
  },

  /**
   * Append a font family to the output.
   *
   * @param  {String} fontFamily
   *         Font family to append.
   */
  _appendFontFamily: function (fontFamily) {
    let quoteChar = null;
    let trailingWhitespace = false;

    // Before appending the actual font-family span, we need to trim
    // down the actual contents by removing any whitespace before and
    // after, and any quotation characters in the passed string.  Any
    // such characters are preserved in the actual output, but just
    // not inside the span element.

    if (fontFamily[0] === " ") {
      this._appendText(" ");
      fontFamily = fontFamily.slice(1);
    }

    if (fontFamily[fontFamily.length - 1] === " ") {
      fontFamily = fontFamily.slice(0, -1);
      trailingWhitespace = true;
    }

    if (fontFamily[0] === "'" || fontFamily[0] === '"') {
      quoteChar = fontFamily[0];
    }

    if (quoteChar) {
      this._appendText(quoteChar);
      fontFamily = fontFamily.slice(1, -1);
    }

    this.parsed.push({
      type: FONT_FAMILY,
      value: fontFamily,
    });

    if (quoteChar) {
      this._appendText(quoteChar);
    }

    if (trailingWhitespace) {
      this._appendText(" ");
    }
  },

  /**
   * Create a node.
   *
   * @param  {String} tagName
   *         Tag type e.g. "div"
   * @param  {Object} attributes
   *         e.g. {class: "someClass", style: "cursor:pointer"};
   * @param  {String} [value]
   *         If a value is included it will be appended as a text node inside
   *         the tag. This is useful e.g. for span tags.
   * @return {Node} Newly created Node.
   */
  _createNode: function (tagName, attributes, value = "") {
    const node = this.doc.createElementNS(HTML_NS, tagName);
    const attrs = Object.getOwnPropertyNames(attributes);

    for (const attr of attrs) {
      if (attributes[attr]) {
        node.setAttribute(attr, attributes[attr]);
      }
    }

    if (value) {
      const textNode = this.doc.createTextNode(value);
      node.appendChild(textNode);
    }

    return node;
  },

  /**
   * Append the given text to the `this.parsed` array. If the last item is a string,
   * join the 2 strings together.
   *
   * @param  {String} text
   *         Text to append
   */
  _appendText: function (text) {
    const lastItem = this.parsed[this.parsed.length - 1];
    if (typeof lastItem === "string") {
      this.parsed[this.parsed.length - 1] = lastItem + text;
    } else {
      this.parsed.push(text);
    }
  },
};

exports.OutputParser = OutputParser;

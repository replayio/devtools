/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import classnames from "classnames";
import React from "react";

import { ELEMENT_STYLE } from "shared/constants";
import { PSEUDO_CLASSES } from "third-party/css/constants";
import {
  SELECTOR_ATTRIBUTE,
  SELECTOR_ELEMENT,
  SELECTOR_PSEUDO_CLASS,
  parsePseudoClassesAndAttributes,
} from "third-party/css/parsing-utils";

import { RuleSelector } from "../models/rule";

interface SelectorProps {
  id: string;
  isUserAgentStyle: boolean | null;
  selector: RuleSelector;
  type: number;
  query: string;
}

export default class Selector extends React.PureComponent<SelectorProps> {
  selectorRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    if (
      this.props.isUserAgentStyle ||
      this.props.type === ELEMENT_STYLE ||
      this.props.type === CSSRule.KEYFRAME_RULE
    ) {
      // Selector is not editable.
      return;
    }
  }

  renderSelector() {
    // Show the text directly for custom selector text (such as the inline "element"
    // style and Keyframes rules).
    if (this.props.type === ELEMENT_STYLE || this.props.type === CSSRule.KEYFRAME_RULE) {
      return this.props.selector.selectorText;
    }

    const { matchedSelectors, selectors } = this.props.selector;
    const output: React.ReactNode[] = [];

    // Go through the CSS rule's selectors and highlight the selectors that actually
    // matches.
    for (let i = 0; i < selectors!.length; i++) {
      const selector = selectors![i];
      // Parse the selector for pseudo classes and attributes, and apply different
      // CSS classes for the parsed values.
      // NOTE: parsePseudoClassesAndAttributes is a good candidate for memoization.
      output.push(
        <span
          className={
            matchedSelectors!.indexOf(selector) > -1
              ? "ruleview-selector-matched"
              : "ruleview-selector-unmatched"
          }
        >
          {parsePseudoClassesAndAttributes(selector).map(
            ({ type, value }: { type: any; value: any }) => {
              let selectorSpanClass = "";

              switch (type) {
                case SELECTOR_ATTRIBUTE:
                  selectorSpanClass += " ruleview-selector-attribute";
                  break;
                case SELECTOR_ELEMENT:
                  selectorSpanClass += " ruleview-selector";
                  break;
                case SELECTOR_PSEUDO_CLASS:
                  selectorSpanClass += PSEUDO_CLASSES.some((p: any) => value === p)
                    ? " ruleview-selector-pseudo-class-lock"
                    : " ruleview-selector-pseudo-class";
                  break;
              }

              return (
                <span key={value} className={selectorSpanClass}>
                  {value}
                </span>
              );
            }
          )}
        </span>
      );

      // Append a comma separator unless this is the last selector.
      if (i < selectors!.length - 1) {
        output.push(<span className="ruleview-selector-separator">{", "}</span>);
      }
    }

    return output;
  }

  render() {
    const className = classnames("ruleview-selectorcontainer", {
      "ruleview-selector-matched":
        this.props.query && this.props.selector.selectorText.match(this.props.query),
    });
    return (
      <span className={className} ref={this.selectorRef} tabIndex={0}>
        {this.props.selector.selectorText}
      </span>
    );
  }
}

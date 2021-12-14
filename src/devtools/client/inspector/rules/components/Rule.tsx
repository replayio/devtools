/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { FC, useRef } from "react";
import { Declarations } from "devtools/client/inspector/rules/components/Declarations";
import { RuleState } from "../state/rules";
import Selector from "devtools/client/inspector/rules/components/Selector";
import { SourceLink } from "devtools/client/inspector/rules/components/SourceLink";

type RuleProps = {
  // onToggleDeclaration: Function;
  // onToggleSelectorHighlighter: Function;
  // showDeclarationNameEditor: Function;
  // showDeclarationValueEditor: Function;
  // showNewDeclarationEditor: Function;
  showSelectorEditor: Function;
  query: string;
  rule: RuleState;
};

export const Rule: FC<RuleProps> = ({
  // onToggleDeclaration,
  // onToggleSelectorHighlighter,
  // showDeclarationNameEditor,
  // showDeclarationValueEditor,
  // showNewDeclarationEditor,
  showSelectorEditor,
  query,
  rule: { id, declarations, sourceLink, selector, type, isUserAgentStyle, isUnmatched },
}) => {
  return (
    <div
      className={
        "ruleview-rule devtools-monospace" +
        (isUnmatched ? " unmatched" : "") +
        (isUserAgentStyle ? " uneditable" : "")
      }
      data-rule-id={id}
    >
      <SourceLink
        id={id}
        isUserAgentStyle={isUserAgentStyle ?? false}
        sourceLink={sourceLink}
        type={type}
      />
      <div className="ruleview-code">
        <div>
          <Selector {...{ id, isUserAgentStyle, selector, showSelectorEditor, type, query }} />
          {
            // type !== CSSRule.KEYFRAME_RULE
            //   ? SelectorHighlighter({
            //       onToggleSelectorHighlighter,
            //       selector,
            //     })
            //   : null,
          }
          <span className="ruleview-ruleopen">{" {"}</span>
        </div>
        <Declarations declarations={declarations} query={query} />
        {
          // dom.li(
          //   {
          //     className: "ruleview-property ruleview-newproperty",
          //     style: {
          //       display: this.state.isNewDeclarationEditorVisible ? "block" : "none",
          //     },
          //   },
          //   dom.span({
          //     className: "ruleview-propertyname",
          //     ref: this.newDeclarationSpan,
          //   })
          // )
        }
        <div className="ruleview-ruleclose" tabIndex={!isUserAgentStyle ? 0 : -1}>
          {"}"}
        </div>
      </div>
    </div>
  );
};

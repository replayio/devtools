import React from "react";

import ExternalLink from "replay-next/components/ExternalLink";

import DeclarationValue from "../../rules/components/DeclarationValue";
import { MatchedSelectorState } from "../state";

interface MatchedSelectorProps {
  selector: MatchedSelectorState;
}

export default function MatchedSelector(props: MatchedSelectorProps) {
  const { selector } = props;

  return (
    <div className={selector.overridden ? "computed-overridden" : ""}>
      <span className="rule-link">
        <ExternalLink
          className="computed-link theme-link"
          title={selector.stylesheetURL}
          tabIndex={0}
        >
          {selector.stylesheet}
        </ExternalLink>
      </span>
      <span dir="ltr" className="rule-text theme-fg-color3">
        <div className="fix-get-selection">{selector.selector}</div>
        <div className="fix-get-selection computed-other-property-value theme-fg-color1">
          <DeclarationValue
            colorSpanClassName="computed-color"
            colorSwatchClassName="computed-colorswatch"
            fontFamilySpanClassName="computed-font-family"
            values={selector.parsedValue}
            important={selector.important}
          />
        </div>
      </span>
    </div>
  );
}

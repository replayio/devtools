import React from "react";
import { ComputedPropertyState } from "../state";
import MatchedSelector from "./MatchedSelector";
const DeclarationValue = require("../../rules/components/DeclarationValue");
const classnames = require("classnames");

interface ComputedPropertyProps {
  property: ComputedPropertyState;
  hidden?: boolean;
  dark: boolean;
  isExpanded: boolean;
  toggleExpanded(): void;
}

function getHeaderClassName(hidden: boolean | undefined, dark: boolean) {
  if (!hidden) {
    return dark ? "computed-property-view row-striped" : "computed-property-view";
  }
  return "computed-property-hidden";
}

function getContentClassName(hidden: boolean | undefined, dark: boolean) {
  if (!hidden) {
    return dark ? "computed-property-content row-striped" : "computed-property-content";
  }
  return "computed-property-hidden";
}

function getTwistyClassName(property: ComputedPropertyState, isExpanded: boolean) {
  return classnames(
    "computed-expander",
    "theme-twisty",
    property.selectors.length > 0 ? "computed-expandable" : undefined,
    isExpanded ? "open" : undefined
  );
}

export default function ComputedProperty(props: ComputedPropertyProps) {
  const { property, hidden, dark, isExpanded, toggleExpanded } = props;
  const headerClassName = getHeaderClassName(hidden, dark);
  const contentClassName = getContentClassName(hidden, dark);
  const twistyClassName = getTwistyClassName(property, isExpanded);

  return (
    <>
      <div className={headerClassName} onDoubleClick={toggleExpanded}>
        <span className="computed-property-name-container">
          <div className={twistyClassName} onClick={toggleExpanded}></div>
          <span
            className="computed-property-name theme-fg-color3"
            tabIndex={undefined}
            dir="ltr"
            title={property.name}
          >
            {property.name}
            <span className="visually-hidden">: </span>
          </span>
        </span>
        <span className="computed-property-value-container">
          <span className="computed-property-value theme-fg-color1" tabIndex={undefined} dir="ltr">
            <DeclarationValue
              colorSpanClassName="computed-color"
              colorSwatchClassName="computed-colorswatch"
              fontFamilySpanClassName="computed-font-family"
              values={property.parsedValue}
            />
          </span>
          <span className="visually-hidden">;</span>
        </span>
      </div>
      <div className={contentClassName}>
        <div className="matchedselectors">
          {isExpanded
            ? property.selectors.map((selector, index) => (
                <MatchedSelector key={index} selector={selector} />
              ))
            : null}
        </div>
      </div>
    </>
  );
}

import classnames from "classnames";
import { getStr } from "devtools/client/inspector/rules/utils/l10n";
import React, { FC, useState } from "react";

import { DeclarationState } from "../state/rules";

const DeclarationValue = require("../../rules/components/DeclarationValue");

type DeclarationProps = {
  declaration: DeclarationState;
  query: string;
};

export const Declaration: FC<DeclarationProps> = ({ declaration, query }) => {
  const [isComputedListExpanded, setIsComputedListExpanded] = useState(false);

  // Only show the computed list expander or the shorthand overridden list if:
  // - The computed properties are actually different from the current property
  //   (i.e these are longhands while the current property is the shorthand).
  // - All of the computed properties have defined values. In case the current property
  //   value contains CSS variables, then the computed properties will be missing and we
  //   want to avoid showing them.
  const hasComputed =
    declaration.computedProperties.some(c => c.name !== declaration.name) &&
    !declaration.computedProperties.every(c => !c.value);

  const onComputedExpanderClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsComputedListExpanded(!isComputedListExpanded);
  };

  const computedPropertyList = isComputedListExpanded && (
    <ul
      className="ruleview-computedlist"
      style={{
        display: "block",
      }}
    >
      {declaration.computedProperties.map(({ name, value, isOverridden }) => (
        <li
          key={`${name}${value}`}
          className={classnames("ruleview-computed", { "ruleview-overridden": isOverridden })}
        >
          <span className="ruleview-namecontainer">
            <span className="ruleview-propertyname theme-fg-color3">{name}</span>
            {": "}
          </span>
          <span className="ruleview-propertyvaluecontainer">
            <span className="ruleview-propertyvalue theme-fg-color1">{value}</span>
            {";"}
          </span>
        </li>
      ))}
    </ul>
  );

  // unused
  // const overriddenFilter =
  //   !declaration.isDeclarationValid || !declaration.isOverridden ? null : (
  //     <div
  //       className="ruleview-overridden-rule-filter"
  //       title={getStr("rule.filterProperty.title")}
  //     ></div>
  //   );

  const overriddenComputedProperties = declaration.computedProperties.filter(
    prop => prop.isOverridden
  );
  const shorthandOverriddenList =
    isComputedListExpanded ||
    declaration.isOverridden ||
    !hasComputed ||
    overriddenComputedProperties.length === 0 ? null : (
      <ul className="ruleview-overridden-items">
        {overriddenComputedProperties.map(({ name, value }) => (
          <li key={`${name}${value}`} className="ruleview-overridden-item ruleview-overridden">
            <span className="ruleview-namecontainer">
              <span className="ruleview-propertyname theme-fg-color3">{name}</span>
              {": "}
            </span>
            <span className="ruleview-propertyvaluecontainer">
              <span className="ruleview-propertyvaluecontainer">{value}</span>
              {";"}
            </span>
          </li>
        ))}
      </ul>
    );

  const warning = declaration.isDeclarationValid ? null : (
    <div
      className="ruleview-warning"
      title={
        declaration.isNameValid ? getStr("rule.warningName.title") : getStr("rule.warning.title")
      }
    ></div>
  );

  const {
    id,
    isEnabled,
    isKnownProperty,
    isOverridden,
    isPropertyChanged,
    name,
    parsedValue,
    value,
  } = declaration;

  const declarationClassName = classnames("ruleview-property", {
    "ruleview-changed": isPropertyChanged,
    "ruleview-matched": query && (name.match(query) || value.match(query)),
    "ruleview-overridden": !isEnabled || !isKnownProperty || isOverridden,
  });

  return (
    <li className={declarationClassName} data-declaration-id={id}>
      <div className="ruleview-propertycontainer">
        <span className="ruleview-namecontainer">
          <span id={id} className="ruleview-propertyname theme-fg-color3" tabIndex={0}>
            {name}
          </span>
          {": "}
          <span
            className={classnames("ruleview-expander theme-twisty", {
              open: isComputedListExpanded,
            })}
            onClick={onComputedExpanderClick}
            style={{ display: hasComputed ? "inline-block" : "none" }}
          ></span>
        </span>
        <span className="ruleview-propertyvaluecontainer">
          <span className="ruleview-propertyvalue theme-fg-color1" tabIndex={0}>
            <DeclarationValue
              {...{
                colorSpanClassName: "ruleview-color",
                colorSwatchClassName: "ruleview-colorswatch ruleview-swatch",
                fontFamilySpanClassName: "ruleview-font-family",
                values: parsedValue,
              }}
            />
          </span>
          {";"}
        </span>
        {warning}
        {/* // this.renderOverriddenFilter() */}
      </div>
      {computedPropertyList}
      {shorthandOverriddenList}
    </li>
  );
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { FC, useRef, useState } from "react";
// const { editableItem } = require("devtools/client/shared/inplace-editor");

import { DeclarationValue } from "devtools/client/inspector/rules/components/DeclarationValue";
import { DeclarationState } from "../state/rules";

const { getStr } = require("devtools/client/inspector/rules/utils/l10n");
const { classes } = require("devtools/client/inspector/rules/utils/utils");

type DeclarationProps = {
  declaration: DeclarationState;
  // isUserAgentStyle: boolean;
  // onToggleDeclaration: (ruleIdd: Rule['id'], declarationId: DeclarationState['id']) => void;
  // showDeclarationNameEditor: Function
  // showDeclarationValueEditor: Function
  query: string;
};

export const Declaration: FC<DeclarationProps> = ({
  declaration,
  // isUserAgentStyle,
  // onToggleDeclaration,
  // showDeclarationNameEditor,
  // showDeclarationValueEditor
  query,
}) => {
  const [isComputedListExpanded, setIsComputedListExpanded] = useState(false);

  const nameSpanRef = useRef<HTMLSpanElement | null>(null);
  const valueSpanRef = useRef<HTMLSpanElement | null>(null);

  /*
  componentDidMount() {
    if (this.props.isUserAgentStyle) {
      // Declaration is not editable.
      return;
    }

    const { ruleId, id } = this.props.declaration;

    editableItem(
      {
        element: this.nameSpanRef.current,
      },
      element => {
        this.props.showDeclarationNameEditor(element, ruleId, id);
      }
    );

    editableItem(
      {
        element: this.valueSpanRef.current,
      },
      element => {
        this.props.showDeclarationValueEditor(element, ruleId, id);
      }
    );
  }
  */
  const hasComputed = (() => {
    // Only show the computed list expander or the shorthand overridden list if:
    // - The computed properties are actually different from the current property
    //   (i.e these are longhands while the current property is the shorthand).
    // - All of the computed properties have defined values. In case the current property
    //   value contains CSS variables, then the computed properties will be missing and we
    //   want to avoid showing them.
    const { computedProperties } = declaration;
    return (
      computedProperties.some(c => c.name !== declaration.name) &&
      !computedProperties.every(c => !c.value)
    );
  })();

  // const onComputedExpanderClick = (event) => {
  //   event.stopPropagation();

  //   this.setState(prevState => {
  //     return { isComputedListExpanded: !prevState.isComputedListExpanded };
  //   });
  // }

  // const onToggleDeclarationChange = (event) => {
  //   event.stopPropagation();
  //   const { id, ruleId } = declaration;
  //   this.props.onToggleDeclaration(declaration.ruleId, declaration.id);
  // }

  // renderComputedPropertyList() {
  //   if (!this.state.isComputedListExpanded) {
  //     return null;
  //   }

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
          className={classes("ruleview-computed", isOverridden && "ruleview-overridden")}
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

  const overriddenFilter =
    !declaration.isDeclarationValid || !declaration.isOverridden ? null : (
      <div
        className="ruleview-overridden-rule-filter"
        title={getStr("rule.filterProperty.title")}
      ></div>
    );

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

  const declarationClassName = classes(
    "ruleview-property",
    query && (name.match(query) || value.match(query)) && "ruleview-matched",
    (!isEnabled || !isKnownProperty || isOverridden) && "ruleview-overridden",
    isPropertyChanged && "ruleview-changed"
  );

  return (
    <li className={declarationClassName} data-declaration-id={id}>
      <div className="ruleview-propertycontainer">
        <input
          type="checkbox"
          aria-labelledby={id}
          className="ruleview-enableproperty"
          checked={isEnabled}
          /* onChange={onToggleDeclarationChange} */
          tabIndex={-1}
          style={{
            visibility: "hidden",
          }}
        />
        <span className="ruleview-namecontainer">
          <span
            id={id}
            className="ruleview-propertyname theme-fg-color3"
            ref={nameSpanRef}
            tabIndex={0}
          >
            {name}
          </span>
          {": "}
          <span
            className={classes("ruleview-expander theme-twisty", isComputedListExpanded && "open")}
            // onClick={onComputedExpanderClick}
            style={{ display: hasComputed ? "inline-block" : "none" }}
          ></span>
        </span>
        <span className="ruleview-propertyvaluecontainer">
          <span className="ruleview-propertyvalue theme-fg-color1" ref={valueSpanRef} tabIndex={0}>
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

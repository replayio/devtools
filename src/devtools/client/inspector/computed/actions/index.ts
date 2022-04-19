import { Action, ThunkAction } from "@reduxjs/toolkit";
import { ThunkExtraArgs } from "ui/utils/thunk";

import CSSProperties from "../../css-properties";
import ElementStyle from "../../rules/models/element-style";
import { ComputedPropertyState, MatchedSelectorState } from "../state";
import { InspectorState } from "../state";

const { OutputParser } = require("devtools/client/shared/output-parser");

type SetComputedPropertiesAction = Action<"set_computed_properties"> & {
  properties: ComputedPropertyState[];
};
type SetComputedPropertySearchAction = Action<"set_computed_property_search"> & { search: string };
type SetShowBrowserStylesAction = Action<"set_show_browser_styles"> & { show: boolean };
type SetComputedPropertyExpandedAction = Action<"set_computed_property_expanded"> & {
  property: string;
  expanded: boolean;
};
export type ComputedAction =
  | SetComputedPropertiesAction
  | SetComputedPropertySearchAction
  | SetShowBrowserStylesAction
  | SetComputedPropertyExpandedAction;

export type InspectorThunkAction<TReturn = void> = ThunkAction<
  TReturn,
  InspectorState,
  ThunkExtraArgs,
  ComputedAction
>;

export function setComputedProperties(elementStyle: ElementStyle): InspectorThunkAction {
  return async dispatch => {
    const properties = await createComputedProperties(elementStyle);
    return dispatch({ properties, type: "set_computed_properties" });
  };
}

export function setComputedPropertySearch(search: string): SetComputedPropertySearchAction {
  return { search, type: "set_computed_property_search" };
}

export function setShowBrowserStyles(show: boolean): SetShowBrowserStylesAction {
  return { show, type: "set_show_browser_styles" };
}

export function setComputedPropertyExpanded(
  property: string,
  expanded: boolean
): SetComputedPropertyExpandedAction {
  return { expanded, property, type: "set_computed_property_expanded" };
}

async function createComputedProperties(
  elementStyle: ElementStyle
): Promise<ComputedPropertyState[]> {
  const computed = await elementStyle.element.getComputedStyle();
  if (!computed) {
    return [];
  }

  const outputParser = new OutputParser(document, CSSProperties);

  const properties: ComputedPropertyState[] = [];
  for (const [name, value] of computed) {
    // the computed style also contains CSS variables, which we don't want to show
    // as properties in the computed view
    if (name.startsWith("--")) {
      continue;
    }

    let inheritanceCounter = 1;
    const selectors: MatchedSelectorState[] = [];
    for (const rule of elementStyle.rules || []) {
      if (rule.isUnmatched) {
        continue;
      }

      let selector: string;
      let stylesheet: string;
      let stylesheetURL: string;
      if (rule.domRule.isRule()) {
        // this is not an inline style
        selector = rule.selectorText;
        stylesheet = rule.sourceLink.label || "";
        stylesheetURL = rule.domRule.href || "";
      } else {
        if (rule.inherited) {
          // this is an inherited inline style
          if (rule.inherited.id) {
            selector = `#${rule.inherited.id}.style`;
          } else {
            selector = `${rule.inherited.displayName.toUpperCase()}[${inheritanceCounter}].style`;
            inheritanceCounter++;
          }
        } else {
          // this is the selected element's own inline style
          selector = "this.style";
        }
        stylesheet = "element";
        stylesheetURL = "#";
      }

      for (const declaration of rule.declarations) {
        for (const property of declaration.computed || []) {
          if (property.name === name) {
            const parsedValue = outputParser.parseCssProperty(name, property.value);
            selectors.push({
              overridden: !!property.overridden,
              parsedValue,
              selector,
              stylesheet,
              stylesheetURL,
              value: property.value,
            });
          }
        }
      }
    }

    const parsedValue = outputParser.parseCssProperty(name, value);

    properties.push({
      name,
      parsedValue,
      selectors,
      value,
    });
  }

  return properties;
}

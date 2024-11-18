import { Action } from "@reduxjs/toolkit";
import QuickLRU from "shared/utils/quick-lru";

import CSSProperties from "third-party/css/css-properties";
import { OutputParser } from "third-party/css/output-parser";

import ElementStyle from "../../rules/models/element-style";
import RuleModel from "../../rules/models/rule";
import { ComputedProperty } from "../../rules/models/text-property";
import { ComputedPropertyState, MatchedSelectorState } from "../state";

type SetComputedPropertySearchAction = Action<"set_computed_property_search"> & { search: string };
type SetShowBrowserStylesAction = Action<"set_show_browser_styles"> & { show: boolean };
type SetComputedPropertyExpandedAction = Action<"set_computed_property_expanded"> & {
  property: string;
  expanded: boolean;
};
export type ComputedAction =
  | SetComputedPropertySearchAction
  | SetShowBrowserStylesAction
  | SetComputedPropertyExpandedAction;

export function setComputedPropertySearch(search: string): SetComputedPropertySearchAction {
  return { type: "set_computed_property_search", search };
}

export function setShowBrowserStyles(show: boolean): SetShowBrowserStylesAction {
  return { type: "set_show_browser_styles", show };
}

export function setComputedPropertyExpanded(
  property: string,
  expanded: boolean
): SetComputedPropertyExpandedAction {
  return { type: "set_computed_property_expanded", property, expanded };
}

const cachedParsedProperties = new QuickLRU<string, (string | Record<string, unknown>)[]>({
  maxSize: 3000,
});

export async function createComputedProperties(
  elementStyle: ElementStyle,
  computed: Map<string, string> | undefined
): Promise<ComputedPropertyState[]> {
  if (!computed) {
    return [];
  }

  const outputParser = new OutputParser(document, CSSProperties);

  const NO_RULES: RuleModel[] = [];
  const NO_COMPUTEDS: ComputedProperty[] = [];

  const properties: ComputedPropertyState[] = [];
  for (const [name, value] of computed) {
    // the computed style also contains CSS variables, which we don't want to show
    // as properties in the computed view
    if (name.startsWith("--")) {
      continue;
    }

    let inheritanceCounter = 1;
    const selectors: MatchedSelectorState[] = [];
    for (const rule of elementStyle.rules || NO_RULES) {
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
          const idAttr = rule.inherited.node.attributes?.find(attr => attr.name === "id");
          if (idAttr) {
            selector = `#${idAttr.value}.style`;
          } else {
            selector = `${rule.inherited.node.nodeName.toUpperCase()}[${inheritanceCounter}].style`;
            inheritanceCounter++;
          }
        } else {
          // this is the selected element's own inline style
          selector = "this.style";
        }
        stylesheet = "element";
        stylesheetURL = "#";
      }

      // TODO [FE-1895+] This is an O(n^4) loop, which is _awful_.
      // We should find a better way to do this.
      for (const declaration of rule.declarations) {
        for (const property of declaration.computed || NO_COMPUTEDS) {
          if (property.name === name) {
            const combinedNameValue = `${name}:${property.value}`;
            let parsedValue = cachedParsedProperties.get(combinedNameValue)!;
            if (!parsedValue) {
              parsedValue = outputParser.parseCssProperty(name, property.value);
              cachedParsedProperties.set(combinedNameValue, parsedValue);
            }

            selectors.push({
              value: property.value,
              parsedValue,
              selector,
              stylesheet,
              stylesheetURL,
              overridden: !!property.overridden,
              important: property.priority === "important",
            });
          }
        }
      }
    }

    const parsedValue = outputParser.parseCssProperty(name, value);

    properties.push({
      name,
      value,
      parsedValue,
      selectors,
    });
  }

  return properties;
}

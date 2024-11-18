export interface ComputedPropertyState {
  name: string;
  value: string;
  parsedValue: any[];
  selectors: MatchedSelectorState[];
}

export interface MatchedSelectorState {
  selector: string;
  value: string;
  parsedValue: any[];
  overridden: boolean;
  stylesheet: string;
  stylesheetURL: string;
  important: boolean;
}

export interface ComputedState {
  expandedProperties: Set<string>;
  search: string;
  showBrowserStyles: boolean;
}
export interface InspectorState {
  computed: ComputedState;
}

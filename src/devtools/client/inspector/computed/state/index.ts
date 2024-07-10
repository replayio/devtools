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
  priority: string;
  overridden: boolean;
  stylesheet: string;
  stylesheetURL: string;
}

export interface ComputedState {
  expandedProperties: Set<string>;
  search: string;
  showBrowserStyles: boolean;
}
export interface InspectorState {
  computed: ComputedState;
}

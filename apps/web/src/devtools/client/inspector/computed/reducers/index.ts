import { createReducer, ReducerObject } from "../../shared/reducer-object";
import { ComputedState } from "../state";
import { ComputedAction } from "../actions";

const INITIAL_COMPUTED: ComputedState = {
  properties: [],
  search: "",
  showBrowserStyles: false,
  expandedProperties: new Set<string>(),
};

const reducers: ReducerObject<ComputedState, ComputedAction> = {
  set_computed_properties(state, { properties }) {
    return { ...state, properties };
  },

  set_computed_property_search(state, { search }) {
    return { ...state, search };
  },

  set_show_browser_styles(state, { show }) {
    return { ...state, showBrowserStyles: show };
  },

  set_computed_property_expanded(state, { property, expanded }) {
    const expandedProperties = new Set(state.expandedProperties);

    if (expanded) {
      expandedProperties.add(property);
    } else {
      expandedProperties.delete(property);
    }

    return { ...state, expandedProperties };
  },
};

export default createReducer(INITIAL_COMPUTED, reducers);

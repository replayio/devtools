import { createReducer, ReducerObject } from "../../shared/reducer-object";
import { ComputedAction } from "../actions";
import { ComputedState } from "../state";

const INITIAL_COMPUTED: ComputedState = {
  expandedProperties: new Set<string>(),
  properties: [],
  search: "",
  showBrowserStyles: false,
};

const reducers: ReducerObject<ComputedState, ComputedAction> = {
  set_computed_properties(state, { properties }) {
    return { ...state, properties };
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

  set_computed_property_search(state, { search }) {
    return { ...state, search };
  },

  set_show_browser_styles(state, { show }) {
    return { ...state, showBrowserStyles: show };
  },
};

export default createReducer(INITIAL_COMPUTED, reducers);

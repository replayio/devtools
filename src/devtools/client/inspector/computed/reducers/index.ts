import { ReducerObject, createReducer } from "../../shared/reducer-object";
import { ComputedAction } from "../actions";
import { ComputedState } from "../state";

const INITIAL_COMPUTED: ComputedState = {
  search: "",
  showBrowserStyles: false,
  expandedProperties: new Set<string>(),
};

const reducers: ReducerObject<ComputedState, ComputedAction> = {
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
  // dispatched by actions/timeline.ts, in `playback()`
  // @ts-expect-error
  "pause/resumed"() {
    // Clear out the DOM nodes data whenever the user hits "Play" in the timeline
    return INITIAL_COMPUTED;
  },
};

export default createReducer(INITIAL_COMPUTED, reducers);

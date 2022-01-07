import { UIState } from "ui/state";
import { createReducer, ReducerObject } from "../../shared/reducer-object";
import { EventTooltipAction } from "../actions/eventTooltip";
import { EventTooltipState } from "../state/eventTooltip";

const INITIAL_STATE: EventTooltipState = { nodeId: null, events: null };

const reducers: ReducerObject<EventTooltipState, EventTooltipAction> = {
  ["set_event_tooltip"](state, { nodeId, events }) {
    return { nodeId, events };
  },

  ["clear_event_tooltip"]() {
    return { nodeId: null, events: null };
  },
};

export default createReducer(INITIAL_STATE, reducers);

export const getEventTooltipNodeId = (state: UIState) => state.eventTooltip.nodeId;
export const getEventTooltipContent = (state: UIState) => state.eventTooltip.events;

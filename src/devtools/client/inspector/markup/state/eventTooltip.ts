import { ValueFront } from "protocol/thread";

export interface EventInfo {
  capturing: boolean;
  type: string;
  origin: string;
  url?: string;
  line?: number;
  column?: number;
  tags: string;
  handler: ValueFront;
  sourceId?: string;
  native: boolean;
  hide: {
    debugger: boolean;
  };
}

export interface EventTooltipState {
  nodeId: string | null;
  events: EventInfo[] | null;
}

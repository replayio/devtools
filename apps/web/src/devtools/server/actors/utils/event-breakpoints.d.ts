export type EventId = string;

export interface EventType {
  id: EventId;
  name: string;
}
export interface EventTypeCategory {
  name: string;
  events: EventType[];
}
export function getAvailableEventBreakpoints(): EventTypeCategory[];

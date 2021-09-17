export interface EventType {
  id: string;
  name: string;
}
export interface EventTypeCategory {
  name: string;
  events: EventType[];
}
export function getAvailableEventBreakpoints(): EventTypeCategory[];

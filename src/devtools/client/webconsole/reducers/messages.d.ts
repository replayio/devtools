export type MessageId = string;
export interface MessageState {
  commandHistory: Command[];
  messagesById: Map<MessageId, Message>;
  visibleMessages: MessageId[];
  filteredMessagesCount: Record<MessageFilter, number>;
  messagesUiById: unknown[];
  messagesPayloadById: Record<unknown, unknown>;
  logpointMessages: Map<unknown, unknown>;
  removedLogpointIds: Set<MessageId>;
  pausedExecutionPoint: unknown | null;
  pausedExecutionPointTime: number;
  hasExecutionPoints: boolean;
  lastMessageId: MessageId;
  overflow: boolean;
  messagesLoaded: boolean;
}

export declare function initialMessageState(overrides: Partial<MessageState>): MessageState;

export interface MessageState {
  commandHistory: Command[];
  messagesLoaded: boolean;
}

export declare function initialMessageState(overrides: MessageState): MessageState;

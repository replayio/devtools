export interface MessageState {
  commandHistory: Command[];
}

export declare function initialMessageState(overrides: MessageState): MessageState;

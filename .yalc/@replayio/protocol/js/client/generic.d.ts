import { CommandMethods, CommandParams, CommandResult, EventMethods, EventParams } from "../protocol";
export interface GenericProtocolClient {
    addEventListener: <M extends EventMethods>(event: M, listener: (params: EventParams<M>) => void) => void;
    removeEventListener?: <M extends EventMethods>(event: M, listener?: (params: EventParams<M>) => void) => void;
    sendCommand: <M extends CommandMethods>(method: M, params: CommandParams<M>, sessionId?: string, pauseId?: string) => Promise<CommandResult<M>>;
}

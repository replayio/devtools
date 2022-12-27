import { CommandMethods, CommandParams, CommandResult, EventMethods, EventParams } from "../protocol";
import { GenericProtocolClient } from "./generic";
/**
 * This interface is designed to be compatible with both `WebSocket`
 * as implemented in browsers as well as the `ws` package from npm.
 */
interface WebSocket {
    onopen: ((ev: any) => any) | null;
    onerror: ((err: any) => any) | null;
    onclose: ((ev: any) => any) | null;
    onmessage: ((ev: any) => void) | null;
    send(msg: string): void;
}
interface SocketCallbacks {
    onClose(code: number, reason: string): void;
    onError(err: Error): void;
}
export declare type EventListeners = {
    [M in EventMethods]: (params: EventParams<M>) => void;
};
export declare class SimpleProtocolClient implements GenericProtocolClient {
    private log;
    private socket;
    private opened;
    private eventListeners;
    private pendingMessages;
    private nextMessageId;
    constructor(webSocket: WebSocket, callbacks: SocketCallbacks, log: (msg: string) => void);
    addEventListener<M extends EventMethods>(event: M, listener: (params: EventParams<M>) => void): void;
    removeEventListener<M extends EventMethods>(event: M, listener?: (params: EventParams<M>) => void): void;
    sendCommand<M extends CommandMethods>(method: M, params: CommandParams<M>, sessionId?: string, pauseId?: string): Promise<CommandResult<M>>;
    private onMessage;
}
export {};

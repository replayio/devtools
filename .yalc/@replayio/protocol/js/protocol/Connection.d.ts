/**
 * Describes a point in time with both relative and absolute times so clients
 * can easily decide which they'd prefer to use.
 */
export interface CloseTimestamp {
    /**
     * The unix timestamp of the target moment, in seconds.
     */
    absolute: number;
    /**
     * The duration between when this was sent, and the target moment, in seconds.
     */
    relative: number;
}
/**
 * Notify clients if the backend expects to disconnect the socket due to inactivity.
 * Clients are expected to present the user with a notification to allow them
 * to cancel the pending disconnect.
 *
 * Clients may assume that this will be a one-time notification for each period
 * of inactivity, meaning that the disconnect time will not change unless the
 * pending disconnect was cancelled and a new period of inactivity arose.
 *
 * Clients may assume that they will not receive this notification more than
 * 30 minutes before the connection is closed. The API will aim to provide
 * a minimum of several minutes of lead time to allow a user to provide input
 * to cancel the pending disconnect.
 */
export interface mayDisconnect {
    /**
     * The time when the backend expects to disconnect the socket, or
     * omitted to indicate that a previous pending disconnect has been cancelled.
     */
    time?: CloseTimestamp;
}
/**
 * Notify clients if the backend expects to explicitly disconnect a socket with
 * no recourse for the user.
 *
 * Clients should handle the possibility of multiple events, but may assume
 * that the remaining time will only decrease in further events.
 *
 * Clients may assume that they will not receive this notification more than
 * 30 minutes before the connection is closed. No explicit expectations
 * are placed on how much time clients will be given before the connection is
 * closed, but sufficient time for a user to react and perform an action to
 * reconnect is the goal.
 */
export interface willDisconnect {
    /**
     * The time when the backend expects to disconnect the socket.
     */
    time: CloseTimestamp;
}

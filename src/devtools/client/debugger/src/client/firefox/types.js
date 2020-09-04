/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * These are Firefox specific types that allow us to type check
 * the packet information exchanged using the Firefox Remote Debug Protocol
 * https://wiki.mozilla.org/Remote_Debugging_Protocol
 */

/**
 * The protocol is carried by a reliable, bi-directional byte stream; data sent
 * in both directions consists of JSON objects, called packets. A packet is a
 * top-level JSON object, not contained inside any other value.
 *
 * Every packet sent to the client has the form:
 *  `{ "to":actor, "type":type, ... }`
 *
 * where actor is the name of the actor to whom the packet is directed and type
 * is a string specifying what sort of packet it is. Additional properties may
 * be present, depending on type.
 *
 * Every packet sent from the server has the form:
 *  `{ "from":actor, ... }`
 *
 * where actor is the name of the actor that sent it. The packet may have
 * additional properties, depending on the situation.
 *
 * If a packet is directed to an actor that no longer exists, the server
 * sends a packet to the client of the following form:
 *  `{ "from":actor, "error":"noSuchActor" }`
 *
 * where actor is the name of the non-existent actor. (It is strange to receive
 * messages from actors that do not exist, but the client evidently believes
 * that actor exists, and this reply allows the client to pair up the error
 * report with the source of the problem.)
 *
 * Clients should silently ignore packet properties they do not recognize. We
 * expect that, as the protocol evolves, we will specify new properties that
 * can appear in existing packets, and experimental implementations will do
 * the same.
 *
 * @see https://wiki.mozilla.org/Remote_Debugging_Protocol#Packets
 * @memberof firefox/packets
 * @static
 */

/**
 * Frame Packet
 * @memberof firefox/packets
 * @static
 */

/**
 * Firefox Source File payload
 * introductionType can be a "scriptElement"
 * @memberof firefox/payloads
 * @static
 */

/**
 * Source Packet sent when there is a "new source" event
 * coming from the debug server
 * @memberof firefox/packets
 * @static
 */

/**
 * Sources Packet from calling threadFront.getSources();
 * @memberof firefox/packets
 * @static
 */

/**
 * Pause Packet sent when the server is in a "paused" state
 *
 * @memberof firefox
 * @static
 */

/**
 * Response from the `getFrames` function call
 * @memberof firefox
 * @static
 */

/**
 * Tab Target gives access to the browser tabs
 * @memberof firefox
 * @static
 */

/**
 * Clients for accessing the Firefox debug server and browser
 * @memberof firefox/clients
 * @static
 */

/**
 * DevToolsClient
 * @memberof firefox
 * @static
 */

/**
 * A grip is a JSON value that refers to a specific JavaScript value in the
 * debuggee. Grips appear anywhere an arbitrary value from the debuggee needs
 * to be conveyed to the client: stack frames, object property lists, lexical
 * environments, paused packets, and so on.
 *
 * For mutable values like objects and arrays, grips do not merely convey the
 * value's current state to the client. They also act as references to the
 * original value, by including an actor to which the client can send messages
 * to modify the value in the debuggee.
 *
 * @see https://wiki.mozilla.org/Remote_Debugging_Protocol#Grips
 * @memberof firefox
 * @static
 */

/**
 * SourceClient
 * @memberof firefox
 * @static
 */

/**
 * ObjectFront
 * @memberof firefox
 * @static
 */

/**
 * ThreadFront
 * @memberof firefox
 * @static
 */

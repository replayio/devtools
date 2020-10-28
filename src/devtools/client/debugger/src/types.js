/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Breakpoint ID
 *
 * @memberof types
 * @static
 */

/**
 * Source ID
 *
 * @memberof types
 * @static
 */

/**
 * Actor ID
 *
 * @memberof types
 * @static
 */

/**
 * Source File Location
 *
 * @memberof types
 * @static
 */

// Type of location used when setting breakpoints in the server. Exactly one of
// { sourceUrl, sourceId } must be specified. Soon this will replace
// SourceLocation and PendingLocation, and SourceActorLocation will be removed
// (bug 1524374).

/**
 * Breakpoint is associated with a Source.
 *
 * @memberof types
 * @static
 */

/**
 * Options for a breakpoint that can be modified by the user.
 */

/**
 * XHR Breakpoint
 * @memberof types
 * @static
 */

/**
 * Breakpoint Result is the return from an add/modify Breakpoint request
 *
 * @memberof types
 * @static
 */

/**
 * PendingBreakpoint
 *
 * @memberof types
 * @static
 */

/**
 * Frame ID
 *
 * @memberof types
 * @static
 */

/**
 * Frame
 * @memberof types
 * @static
 */

/**
 * ContextMenuItem
 *
 * @memberof types
 * @static
 */

/**
 * why
 * @memberof types
 * @static
 */

/**
 * why
 * @memberof types
 * @static
 */

/**
 * Why is the Debugger Paused?
 * This is the generic state handling the reason the debugger is paused.
 * Reasons are usually related to "breakpoint" or "debuggerStatement"
 * and should eventually be specified here as an enum.  For now we will
 * just offer it as a string.
 * @memberof types
 * @static
 */

/**
 * Pause
 * @memberof types
 * @static
 */

/**
 * PreviewGrip
 * @memberof types
 * @static
 */

/**
 * Grip
 * @memberof types
 * @static
 */

/**
 * Source
 *
 * @memberof types
 * @static
 */

/**
 * Script
 * This describes scripts which are sent to the debug server to be eval'd
 * @memberof types
 * @static
 * FIXME: This needs a real type definition
 */

/**
 * Describes content of the binding.
 * FIXME Define these type more clearly
 */

/**
 * Defines map of binding name to its content.
 */

/**
 * Scope
 * @memberof types
 * @static
 */

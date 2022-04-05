/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

type PendingStatus = { state: "pending" };
type FulfilledStatus<FulfilledValue> = { state: "fulfilled"; value: FulfilledValue };
type RejectedStatus<RejectedValue = unknown> = { state: "rejected"; value: RejectedValue };

type AsyncValue<FulfilledValue, RejectedValue = unknown> =
  | PendingStatus
  | FulfilledStatus<FulfilledValue>
  | RejectedStatus<RejectedValue>;

export function pending(): PendingStatus {
  return { state: "pending" };
}
export function fulfilled<T>(value: T): FulfilledStatus<T> {
  return { state: "fulfilled", value };
}
export function rejected<T>(value: T): RejectedStatus<T> {
  return { state: "rejected", value };
}

export function asSettled<FulfilledValue, RejectedValue = unknown>(
  statusEntry: AsyncValue<FulfilledValue, RejectedValue>
) {
  if (statusEntry) {
    if (isFulfilled<FulfilledValue>(statusEntry)) {
      return statusEntry.value;
    } else if (isRejected<RejectedValue>(statusEntry)) {
      return statusEntry.value;
    }
  }

  return null;

  // return value && value.state !== "pending" ? value : null;
}

export function isPending(statusEntry: any): statusEntry is PendingStatus {
  return statusEntry.state === "pending";
}
export function isFulfilled<T>(statusEntry: any): statusEntry is FulfilledStatus<T> {
  return statusEntry.state === "fulfilled";
}
export function isRejected<T>(statusEntry: any): statusEntry is RejectedStatus<T> {
  return statusEntry.state === "rejected";
}

type AsyncAction<FulfilledValue, RejectedValue = unknown> =
  | { status: "start" }
  | { status: "error"; error: RejectedValue }
  | { status: "done"; value: FulfilledValue };

export function asyncActionAsValue<FulfilledValue, RejectedValue = unknown>(
  action: AsyncAction<FulfilledValue, RejectedValue>
) {
  if (action.status === "start") {
    return pending();
  }
  if (action.status === "error") {
    return rejected<RejectedValue>(action.error);
  }
  return fulfilled<FulfilledValue>(action.value);
}

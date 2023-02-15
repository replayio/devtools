export const STATUS_PENDING = 0;
export const STATUS_RESOLVED = 1;
export const STATUS_REJECTED = 2;

export type StatusPending = typeof STATUS_PENDING;
export type StatusResolved = typeof STATUS_RESOLVED;
export type StatusRejected = typeof STATUS_REJECTED;

export type PendingRecord<T> = {
  status: StatusPending;
  value: Wakeable<T>;
};

export type ResolvedRecord<T> = {
  status: StatusResolved;
  value: T;
};

export type RejectedRecord = {
  status: StatusRejected;
  value: any;
};

export type Record<T> = PendingRecord<T> | ResolvedRecord<T> | RejectedRecord;

// This type defines the subset of the Promise API that React uses (the .then method to add success/error callbacks).
// You can use a Promise for this, but Promises have a downside (the microtask queue).
// You can also create your own "thennable" if you want to support synchronous resolution/rejection.
export interface Thennable<T> {
  then(onFulfill: (value: T) => any, onReject?: (err: any) => any): void | Thennable<T>;
}

// Convenience type used by Suspense caches.
// Adds the ability to resolve or reject a pending Thennable.
export interface Wakeable<T> extends Thennable<T> {
  reject(error: any): void;
  resolve(value: T): void;
}

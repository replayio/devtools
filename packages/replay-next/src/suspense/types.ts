export const STATUS_PENDING = "pending";
export const STATUS_RESOLVED = "resolved";
export const STATUS_REJECTED = "rejected";

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

// Convenience type used by Suspense caches.
// Adds the ability to resolve or reject a pending Thenable.
export interface Wakeable<T> extends PromiseLike<T> {
  reject(error: any): void;
  resolve(value: T): void;
}

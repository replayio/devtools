import "react";

declare module "react" {
  type Callback = () => void;

  // The following hooks are only available in the experimental react release.
  export function useDeferredValue(value: T): T;
  export function useTransition(): [isPending: boolean, startTransition: (Callback) => void];
}

import "react";

declare module "react" {
  type Callback = () => void;

  // useTransition() is only available in the experimental react release.
  export function useTransition(): [isPending: boolean, startTransition: (Callback) => void];
}

import { Nag } from "ui/hooks/users";

export function shouldShowNag(nags: Nag[], key: Nag) {
  return nags && !nags.includes(key);
}

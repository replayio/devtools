import type { IconNames } from "./types";
import iconSprite from "./sprite.svg";

export type IconProps = { name: IconNames; size?: number; className: string };

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <use href={`${iconSprite}#${name}`} />
    </svg>
  );
}

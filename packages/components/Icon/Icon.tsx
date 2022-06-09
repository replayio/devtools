import type { IconNames } from "../../icons";
import { iconMap } from "../../icons";
import * as icons from "../../icons";
import type { SVGProps } from "react";

export type IconProps = { name: IconNames } & SVGProps<SVGSVGElement>;

export function Icon({ name, ...props }: IconProps) {
  const iconName = iconMap[name];
  const Element = icons[iconName];
  return <Element fill="var(--body-color)" {...props} />;
}

import type { SVGProps } from "react";

import type { IconNames } from "./icons";
import * as icons from "./icons";

export type IconProps = { name: IconNames } & SVGProps<SVGSVGElement>;

export function Icon({ name, ...props }: IconProps) {
  const Element = icons[name];
  return <Element {...props} />;
}

import classNames from "classnames";
import React, { forwardRef } from "react";

type ButtonSizes = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
type ButtonStyles = "primary" | "secondary" | "disabled";
type ColorScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type Colors = "gray" | "blue" | "red" | "yellow" | "green" | "indigo" | "purple" | "pink" | "white";

const STANDARD_CLASSES = {
  sm:
    "inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded",
  md:
    "inline-flex items-center px-3 py-2 border border-transparent text-default leading-4 font-medium rounded-md",
  lg: "inline-flex items-center px-4 py-2 border border-transparent text-default font-medium rounded-md",
  xl:
    "inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md",
  "2xl":
    "inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md",
  "3xl":
    "inline-flex items-center px-6 py-3 border border-transparent text-2xl font-medium rounded-md",
};

function getColorCode(color: Colors, num: ColorScale) {
  // We convert blue-600 and blue-700 to primaryAccent and primaryAccentHover
  if (color === "blue") {
    if (num === 600) {
      return "primaryAccent";
    } else if (num === 700) {
      return "primaryAccentHover";
    }
  }

  if (color === "pink") {
    if (num === 600) {
      return "secondaryAccent";
    } else if (num === 700) {
      return "secondaryAccentHover";
    }
  }

  return `${color}-${num}`;
}

function getTextClass(color: Colors) {
  if (color === "white") {
    return "text-white";
  }

  return `text-${getColorCode(color, 700)}`;
}

function getColorClasses(color: Colors, style: ButtonStyles) {
  let textStyle, bgStyle;

  if (style === "primary") {
    textStyle = getTextClass("white");
    bgStyle = `bg-${getColorCode(color, 600)} hover:bg-${getColorCode(color, 700)}`;
  } else if (style === "secondary") {
    textStyle = getTextClass(color);
    bgStyle = `border-${getColorCode(color, 600)} hover:border-${getColorCode(color, 700)}`;
  } else {
    textStyle = getTextClass("gray");
    bgStyle = `bg-gray-300`;
  }

  return `${textStyle} ${bgStyle}`;
}

export function getButtonClasses(color: Colors, style: ButtonStyles, size: ButtonSizes) {
  const standardClasses = STANDARD_CLASSES[size];
  const colorClasses = getColorClasses(color, style);
  const focusClasses = `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${getColorCode(
    color,
    500
  )}`;

  return classNames(standardClasses, colorClasses, focusClasses);
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    color: Colors;
    size: ButtonSizes;
    style: ButtonStyles;
  }
>(({ size, children, style, color, className, onClick = () => {}, type }, ref) => {
  const buttonClasses = getButtonClasses(color, style, size);

  return (
    <button
      onClick={onClick}
      disabled={style === "disabled"}
      className={classNames(buttonClasses, className)}
      ref={ref}
      type={type}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";

interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}

export const PrimaryLgButton = (props: ButtonProps & { color: Colors }) => (
  <Button {...props} size="2xl" style="primary" />
);
export const SecondaryLgButton = (props: ButtonProps & { color: Colors }) => (
  <Button {...props} size="2xl" style="secondary" />
);
export const DisabledLgButton = (props: ButtonProps) => (
  <Button {...props} size="2xl" style="disabled" className="cursor-default" color="gray" />
);

export const PrimarySmButton = (props: ButtonProps & { color: Colors }) => (
  <Button {...props} size="sm" style="primary" />
);
export const SecondarySmButton = (props: ButtonProps & { color: Colors }) => (
  <Button {...props} size="sm" style="secondary" />
);
export const DisabledSmButton = (props: ButtonProps) => (
  <Button {...props} size="sm" style="disabled" className="cursor-default" color="gray" />
);

export const PrimaryButton = (props: ButtonProps & { color: Colors }) => (
  <Button {...props} size="md" style="primary" />
);
export const SecondaryButton = (props: ButtonProps & { color: Colors }) => (
  <Button {...props} size="md" style="secondary" />
);
export const DisabledButton = (props: ButtonProps) => (
  <Button {...props} size="md" style="disabled" className="cursor-default" color="gray" />
);

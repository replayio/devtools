import classNames from "classnames";
import React, { forwardRef } from "react";

type ButtonSizes = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
type ButtonStyles = "primary" | "secondary" | "disabled";
type ColorScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type Colors = "gray" | "blue" | "red" | "yellow" | "green" | "indigo" | "purple" | "pink" | "white";

// coercing tailwind purge to preserve these dynamic classes
// prettier-ignore
["bg-gray-50","bg-gray-100","bg-gray-200","bg-gray-300","bg-gray-400","bg-gray-500","bg-gray-600","bg-gray-700","bg-gray-800","bg-gray-900","bg-blue-50","bg-blue-100","bg-blue-200","bg-blue-300","bg-blue-400","bg-blue-500","bg-blue-600","bg-blue-700","bg-blue-800","bg-blue-900","bg-red-50","bg-red-100","bg-red-200","bg-red-300","bg-red-400","bg-red-500","bg-red-600","bg-red-700","bg-red-800","bg-red-900","bg-yellow-50","bg-yellow-100","bg-yellow-200","bg-yellow-300","bg-yellow-400","bg-yellow-500","bg-yellow-600","bg-yellow-700","bg-yellow-800","bg-yellow-900","bg-green-50","bg-green-100","bg-green-200","bg-green-300","bg-green-400","bg-green-500","bg-green-600","bg-green-700","bg-green-800","bg-green-900","bg-indigo-50","bg-indigo-100","bg-indigo-200","bg-indigo-300","bg-indigo-400","bg-indigo-500","bg-indigo-600","bg-indigo-700","bg-indigo-800","bg-indigo-900","bg-purple-50","bg-purple-100","bg-purple-200","bg-purple-300","bg-purple-400","bg-purple-500","bg-purple-600","bg-purple-700","bg-purple-800","bg-purple-900","bg-pink-50","bg-pink-100","bg-pink-200","bg-pink-300","bg-pink-400","bg-pink-500","bg-pink-600","bg-pink-700","bg-pink-800","bg-pink-900","bg-white-50","bg-white-100","bg-white-200","bg-white-300","bg-white-400","bg-white-500","bg-white-600","bg-white-700","bg-white-800","bg-white-900","text-gray-50","text-gray-100","text-gray-200","text-gray-300","text-gray-400","text-gray-500","text-gray-600","text-gray-700","text-gray-800","text-gray-900","text-blue-50","text-blue-100","text-blue-200","text-blue-300","text-blue-400","text-blue-500","text-blue-600","text-blue-700","text-blue-800","text-blue-900","text-red-50","text-red-100","text-red-200","text-red-300","text-red-400","text-red-500","text-red-600","text-red-700","text-red-800","text-red-900","text-yellow-50","text-yellow-100","text-yellow-200","text-yellow-300","text-yellow-400","text-yellow-500","text-yellow-600","text-yellow-700","text-yellow-800","text-yellow-900","text-green-50","text-green-100","text-green-200","text-green-300","text-green-400","text-green-500","text-green-600","text-green-700","text-green-800","text-green-900","text-indigo-50","text-indigo-100","text-indigo-200","text-indigo-300","text-indigo-400","text-indigo-500","text-indigo-600","text-indigo-700","text-indigo-800","text-indigo-900","text-purple-50","text-purple-100","text-purple-200","text-purple-300","text-purple-400","text-purple-500","text-purple-600","text-purple-700","text-purple-800","text-purple-900","text-pink-50","text-pink-100","text-pink-200","text-pink-300","text-pink-400","text-pink-500","text-pink-600","text-pink-700","text-pink-800","text-pink-900","text-white-50","text-white-100","text-white-200","text-white-300","text-white-400","text-white-500","text-white-600","text-white-700","text-white-800","text-white-900"]

const STANDARD_CLASSES = {
  sm: "inline-flex flex-shrink-0 items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded",
  md: "inline-flex flex-shrink-0 items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md",
  lg: "inline-flex flex-shrink-0 items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md",
  xl: "inline-flex flex-shrink-0 items-center px-4 py-2 border border-transparent text-base font-medium rounded-md",
  "2xl":
    "inline-flex flex-shrink-0 items-center px-6 py-3 border border-transparent text-base font-medium rounded-md",
  "3xl":
    "inline-flex flex-shrink-0 items-center px-6 py-3 border border-transparent text-2xl font-medium rounded-md",
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
    return "text-buttontextColor";
  }

  return `text-${getColorCode(color, 700)}`;
}

function getColorClasses(color: Colors, style: ButtonStyles) {
  let bgStyle, textStyle;

  if (style === "primary") {
    textStyle = getTextClass("white");
    bgStyle = `bg-${getColorCode(color, 600)} hover:bg-${getColorCode(color, 700)}`;
  } else if (style === "secondary") {
    textStyle = getTextClass(color);
    bgStyle = `border-${getColorCode(color, 600)} hover:border-${getColorCode(color, 700)}`;
  } else {
    textStyle = getTextClass("gray");
    bgStyle = `bg-gray-200`;
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
    disabled?: boolean;
    size: ButtonSizes;
    style: ButtonStyles;
  }
>(
  (
    {
      size,
      children,
      dataTestId,
      dataTestName,
      disabled,
      style,
      color,
      className,
      onClick = () => {},
      type,
    },
    ref
  ) => {
    const buttonClasses = getButtonClasses(color, style, size);

    return (
      <button
        onClick={onClick}
        data-test-id={dataTestId}
        data-test-name={dataTestName}
        disabled={disabled || style === "disabled"}
        className={classNames(buttonClasses, className)}
        ref={ref}
        type={type}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  dataTestId?: string;
  dataTestName?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}

export const PrimaryLgButton = (props: ButtonProps & { color: Colors }) => (
  <Button {...props} size="2xl" style="primary" />
);
export const SecondaryLgButton = (props: ButtonProps & { color: Colors }) => (
  <Button {...props} size="2xl" style="secondary" />
);

export const PrimaryButton = (props: ButtonProps & { color: Colors }) => (
  <Button {...props} size="md" style="primary" />
);
export const SecondaryButton = (props: ButtonProps & { color: Colors }) => (
  <Button {...props} size="md" style="secondary" />
);

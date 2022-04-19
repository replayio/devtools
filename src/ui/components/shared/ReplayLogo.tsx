import { selector } from "devtools/client/inspector/rules/types";
import React from "react";
import { useSelector } from "react-redux";
import { useFeature } from "ui/hooks/settings";
import { getTheme } from "ui/reducers/app";
import { AppTheme } from "ui/state/app";

const logoSizes = {
  lg: "h-32",
  md: "h-16",
  sm: "h-8",
  xs: "h-4",
};
const logoColors = {
  fuschia: "#F02D5E",
  gray: "var(--cool-gray-500)",
  white: "#FFF",
};

const Logo = () => (
  <svg viewBox="0 0 34 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
    <path
      d="M15.2233 8.58217L8.95319 4.91069L2.68305 1.23921C2.41111 1.08012 2.10269 0.9964 1.78875 0.99646C1.47482 0.99652 1.16642 1.08036 0.894545 1.23955C0.622668 1.39875 0.396884 1.6277 0.239864 1.90341C0.0828448 2.17911 0.000118376 2.49187 0 2.81026V17.496C0.000105567 17.8144 0.0828232 18.1272 0.239837 18.4029C0.396852 18.6786 0.622634 18.9076 0.894513 19.0668C1.16639 19.226 1.47479 19.3098 1.78874 19.3099C2.10268 19.31 2.41111 19.2262 2.68305 19.0671L8.95319 15.3957L15.2233 11.7243C15.4952 11.5651 15.721 11.336 15.878 11.0603C16.035 10.7845 16.1177 10.4717 16.1177 10.1532C16.1177 9.83477 16.035 9.52193 15.878 9.24616C15.721 8.97038 15.4952 8.74138 15.2233 8.58217V8.58217Z"
      fill="currentColor"
    />
    <path
      d="M15.2233 29.0322L8.95319 25.3608L2.68305 21.6893C2.41111 21.5302 2.10268 21.4465 1.78873 21.4465C1.47479 21.4466 1.16639 21.5304 0.894513 21.6896C0.622634 21.8488 0.396847 22.0778 0.239833 22.3535C0.0828188 22.6292 0.000105567 22.942 0 23.2604V37.9461C0.000105567 38.2645 0.0828188 38.5773 0.239833 38.853C0.396847 39.1287 0.622634 39.3577 0.894513 39.5169C1.16639 39.6761 1.47479 39.7599 1.78873 39.76C2.10268 39.76 2.41111 39.6763 2.68305 39.5172L8.95319 35.8458L15.2233 32.1743C15.4952 32.0151 15.721 31.7861 15.878 31.5103C16.035 31.2346 16.1177 30.9217 16.1177 30.6033C16.1177 30.2848 16.035 29.9719 15.878 29.6962C15.721 29.4204 15.4952 29.1914 15.2233 29.0322Z"
      fill="currentColor"
    />
    <path
      d="M33.1056 18.809L26.8355 15.1375L20.5654 11.4661C20.2935 11.307 19.985 11.2233 19.6711 11.2233C19.3572 11.2234 19.0488 11.3072 18.7769 11.4664C18.505 11.6256 18.2792 11.8546 18.1222 12.1303C17.9652 12.406 17.8825 12.7187 17.8823 13.0371V27.7229C17.8825 28.0413 17.9652 28.354 18.1222 28.6297C18.2792 28.9055 18.505 29.1344 18.7769 29.2936C19.0488 29.4528 19.3572 29.5366 19.6711 29.5367C19.985 29.5367 20.2935 29.453 20.5654 29.2939L26.8355 25.6225L33.1056 21.9511C33.3775 21.7918 33.6033 21.5628 33.7603 21.2871C33.9173 21.0113 34 20.6985 34 20.38C34 20.0616 33.9173 19.7487 33.7603 19.473C33.6033 19.1972 33.3775 18.9682 33.1056 18.809V18.809Z"
      fill="currentColor"
    />
  </svg>
);

export default function ReplayLogo({
  color = "fuschia",
  wide,
  size = "lg",
}: {
  color?: keyof typeof logoColors;
  wide?: boolean;
  size?: keyof typeof logoSizes;
}) {
  const theme = useSelector(getTheme);
  const height = logoSizes[size];

  if (wide) {
    const src = theme === "dark" ? "/images/logo-wide-dark.svg" : "/images/logo-wide.svg";
    return <img className={`${height} w-auto`} src={src} />;
  }

  const colorCode = logoColors[color];

  return (
    <div className={`${height} w-auto`} style={{ color: colorCode }}>
      <Logo />
    </div>
  );
}

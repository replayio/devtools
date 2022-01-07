import React from "react";

export default function WelcomeBanner({
  children,
  em = "Replay",
  subtitle,
  title,
}: {
  children?: React.ReactNode;
  subtitle?: string;
  title?: string;
  em?: string;
}) {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="relative overflow-hidden text-center">
        {title || em ? (
          <h1 className="text-5xl font-bold text-gray-800">
            {title}{" "}
            <div className="inline-block relative">
              {em}
              <svg
                className="absolute w-full"
                data-name="Layer 1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 400 16"
                width="400"
                height="16"
              >
                <defs>
                  <linearGradient
                    id="a"
                    y1="13.69"
                    x2="435.45"
                    y2="13.69"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="matrix(.91716 0 0 .7708 .27 .687)"
                  >
                    <stop offset="0" stopColor="#616eb3" />
                    <stop offset=".5" stopColor="#ec1067" />
                    <stop offset="1" stopColor="#f6901e" />
                  </linearGradient>
                </defs>
                <path
                  vectorEffect="non-scaling-stroke"
                  d="M3.12 14c161-19.73 207.41 3 223.21-.65 16.76-3.85 20-6.77 31.28-10.29 18.08-5.64-2.49 13.2 8.14 10.71 16.45-3.84 27.73-7.39 39.25-9.4 15-2.6-2 22.49 87.48-2.37"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  stroke="url(#a)"
                />
              </svg>
            </div>
          </h1>
        ) : null}
        {subtitle ? (
          <h2 style={{ width: "660px" }} className="text-xl mt-6 text-gray-600">
            {subtitle}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  );
}

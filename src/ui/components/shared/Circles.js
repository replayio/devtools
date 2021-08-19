import React from "react";
import "./Circles.css";

const circles = {
  bigTopRight: {
    width: "300px",
    height: "300px",
    left: "calc(60% - 150px)",
    top: "-150px",
  },
  smallBottomLeft: {
    width: "120px",
    height: "120px",
    left: "calc(20%)",
    bottom: "50px",
  },
  bigBottomRight: {
    width: "240px",
    height: "240px",
    left: "calc(80% - 120px)",
    bottom: "-120px",
  },
  bigBottomLeft: {
    width: "240px",
    height: "240px",
    left: "calc(20% - 120px)",
    bottom: "-120px",
  },
  smallTopCenter: {
    width: "120px",
    height: "120px",
    left: "calc(40% - 60px)",
    top: "-60px",
  },
  smallTopRight: {
    width: "120px",
    height: "120px",
    top: "calc(20% - 60px)",
    right: "-60px",
  },
  bigCenterLeft: {
    width: "300px",
    height: "300px",
    top: "calc(70% - 150px)",
    left: "-150px",
  },
  bigRightTop: {
    width: "300px",
    height: "300px",
    top: "calc(30% - 150px)",
    right: "-150px",
  },
  smallLeftBottom: {
    width: "120px",
    height: "120px",
    top: "calc(80% - 60px)",
    left: "120px",
  },
};

function Circle({ label }) {
  if (!circles[label]) {
    return null;
  }
  const { width, height, left, right, top, bottom } = circles[label];

  let style = { width, height };
  if (left) {
    style = { ...style, left };
  }
  if (right) {
    style = { ...style, right };
  }
  if (top) {
    style = { ...style, top };
  }
  if (bottom) {
    style = { ...style, bottom };
  }

  return <div className="visual-circle" style={style} />;
}

export default function Circles({ randomNumber }) {
  console.log("HEEEY");
  const circles = [
    [<Circle label="bigTopRight" key={1} />, <Circle label="smallBottomLeft" key={2} />],
    [<Circle label="smallLeftBottom" key={1} />, <Circle label="bigRightTop" key={2} />],
    [<Circle label="bigBottomLeft" key={1} />],
    [<Circle label="smallTopRight" key={1} />, <Circle label="bigCenterLeft" key={2} />],
    [<Circle label="smallTopCenter" key={1} />, <Circle label="bigBottomRight" key={2} />],
  ];

  console.log(circles);

  return <div>HI{circles[Math.floor(randomNumber * 5)]}</div>;
}

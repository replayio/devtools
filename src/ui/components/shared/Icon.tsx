import React from "react";

export default function Icon(props) {
  return (
    <img
      className="replay-icon"
      style={{ webkitMaskImage: `url(/images/${props.filename}.svg)` }}
      src={`/images/${props.filename}.svg`}
    />
  );
}

//

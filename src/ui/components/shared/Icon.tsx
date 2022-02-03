import React from "react";

export default function Icon(props) {
  const iconStyle = {
    height: props.height,
    width: props.width,
  };

  return <div className={`img ${props.filename}`} style={iconStyle} />;
}

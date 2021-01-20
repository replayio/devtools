import React, { useEffect } from "react";
import Lottie from "react-lottie";
import forwardData from "image/lottie/forward.json";

export default function Loader({ message }) {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: forwardData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div className="old-loader">
      <Lottie options={defaultOptions} height={50} width={200} margin={"auto"} />
      <div className="loading-message">{message}</div>
    </div>
  );
}

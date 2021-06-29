import React from "react";
import LoadingProgressBar from "ui/components/shared/LoadingProgressBar";

export default function Loader() {
  return (
    <div className="relative">
      <LoadingProgressBar />
    </div>
  );
}

import React from "react";

export default function NewTab() {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="text-center">
        <img src="/images/logo.svg" className="inline-block m-8 h-12 w-12" />
        <h1 style={{ width: 420 }} className="text-2xl text-gray-600">
          Please navigate to the page you want to record, then press the blue record button.
        </h1>
      </div>
    </div>
  );
}

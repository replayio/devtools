import classNames from "classnames";
import React, { useEffect, useState } from "react";
import Modal from "ui/components/shared/NewModal";

const slides = [
  {
    header: "Success!",
    content: (
      <>
        <div>{`Your Replay has been recorded! 🎉`}</div>
        <div>{`We're uploading and will let you know when it's safe to close this tab.`}</div>
      </>
    ),
  },
  {
    header: "Our apologies",
    content: (
      <>
        <div>{`Your upload appears to have stalled.`}</div>
        <div>{`We're sorry for the inconvenience and we're looking into the issue. In the meantime, please try your recording again.`}</div>
      </>
    ),
  },
];

export default function UploadingScreen() {
  const [current, setCurrent] = useState<number>(1);
  const { header, content } = slides[current - 1];

  useEffect(() => {
    // Show the error content at the 1 minute mark.
    setTimeout(() => {
      setCurrent(2);
    }, 60000);
  }, []);

  return (
    <main
      className="w-full h-full"
      style={{ background: "linear-gradient(to bottom right, #68DCFC, #4689F8)" }}
    >
      <Modal>
        <div
          className="p-12 bg-white rounded-lg shadow-xl text-xl space-y-12 relative flex flex-col"
          style={{ width: "400px" }}
        >
          <h2 className="font-bold text-3xl ">{header}</h2>
          <div className="text-gray-500 space-y-6">{content} </div>
        </div>
      </Modal>
    </main>
  );
}

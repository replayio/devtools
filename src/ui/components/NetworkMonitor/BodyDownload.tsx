import { useEffect, useMemo } from "react";
import { RawBody } from "./content";

const BodyDownload = ({ raw, filename }: { raw: RawBody; filename: string }) => {
  const dataURL = useMemo(
    () => URL.createObjectURL(new Blob(raw.content, { type: raw.contentType })),
    [raw]
  );

  useEffect(() => {
    return () => URL.revokeObjectURL(dataURL);
  }, [dataURL]);

  return (
    <a href={dataURL} download={filename} target="_blank" rel="noreferrer noopener">
      <div className="mt-4 text-white inline-block p-2 rounded-lg bg-primaryAccent">
        Download Body
      </div>
    </a>
  );
};

export default BodyDownload;

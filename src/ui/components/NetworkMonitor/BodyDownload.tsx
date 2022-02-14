import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import MaterialIcon from "../shared/MaterialIcon";
import { RawBody } from "./content";

const BodyDownload = ({ raw, filename }: { raw: RawBody; filename: string }) => {
  const [downloaded, setDownloaded] = useState(false);
  const dataURL = useMemo(
    () => URL.createObjectURL(new Blob(raw.content, { type: raw.contentType })),
    [raw]
  );

  useEffect(() => {
    return () => URL.revokeObjectURL(dataURL);
  }, [dataURL]);

  return (
    <a
      className="block flex items-center ml-1"
      href={dataURL}
      download={filename}
      target="_blank"
      rel="noreferrer noopener"
      onClick={() => {
        setDownloaded(true);
        setTimeout(() => {
          setDownloaded(false);
        }, 2000);
      }}
    >
      <MaterialIcon iconSize="lg" className={classNames({ "text-primaryAccent": downloaded })}>
        file_download
      </MaterialIcon>
    </a>
  );
};

export default BodyDownload;

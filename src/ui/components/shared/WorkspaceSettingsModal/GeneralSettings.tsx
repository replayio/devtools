import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";

import hooks from "ui/hooks";

import Base64Image from "../Base64Image";
import useDebounceState from "./useDebounceState";

const Label = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <div className={classNames(className, "w-4/12 flex-shrink-0")}>
      <label>{children}</label>
    </div>
  );
};

const Input = ({ children }: { children: React.ReactNode }) => {
  return <div className="w-8/12">{children}</div>;
};

const Row = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex items-center">{children}</div>;
};

const useImageUpload = (
  image: string | null | undefined,
  imageFormat: string | null | undefined,
  maxSize: number,
  callback: (format: string, img: string) => void
) => {
  const [err, setErr] = useState<string>();
  const [img, setImg] = useState(image);
  const [fmt, setImgFmt] = useState(imageFormat);

  const onUpload = (input: HTMLInputElement) => {
    const f = input.files?.[0];
    if (!f) {
      return;
    }

    f.arrayBuffer().then(b => {
      if (maxSize && b.byteLength > maxSize * 1024) {
        setErr(`Image must be less than ${maxSize} kilobytes`);
        return;
      }

      const ua = new Uint8Array(b);
      const str = ua.reduce((a, b) => a + String.fromCharCode(b), "");
      const newImage = btoa(str);
      setErr(undefined);
      callback(f.type, newImage);
      setImg(newImage);
      setImgFmt(f.type);
    });
  };

  return { img, format: fmt, err, onUpload };
};

const GeneralSettings = ({ workspaceId }: { workspaceId: string }) => {
  const { workspace } = hooks.useGetWorkspace(workspaceId);
  const updateWorkspaceSettings = hooks.useUpdateWorkspaceSettings();
  const updateWorkspaceLogo = hooks.useUpdateWorkspaceLogo();
  const { img, format, err, onUpload } = useImageUpload(
    workspace?.logo,
    workspace?.logoFormat,
    50,
    (format, logo) =>
      updateWorkspaceLogo({
        variables: {
          workspaceId,
          logo,
          format,
        },
      })
  );

  const [name, setName] = useDebounceState(
    workspace?.name,
    name =>
      name &&
      updateWorkspaceSettings({
        variables: {
          workspaceId,
          name,
        },
      })
  );

  if (!workspace) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Row>
        <Label>Name</Label>
        {/* Only enable workspace name edit if team is organization https://github.com/RecordReplay/devtools/issues/6799 */}
        {workspace.isOrganization ? (
          <Input>
            <input
              className="w-full rounded-md border-textFieldBorder bg-themeTextFieldBgcolor text-sm"
              type="text"
              value={name}
              onChange={e => setName(e.currentTarget.value)}
            />
          </Input>
        ) : (
          <div className="w-8/12">
            <div className="py-2 text-sm">{name}</div>
          </div>
        )}
      </Row>
      <Row>
        <Label className="self-start">Logo</Label>
        <Input>
          <div className="flex flex-col items-start space-y-4">
            {img ? <Base64Image className="block max-h-12" format={format} src={img} /> : null}
            <label className="flex-inline cursor-pointer items-center justify-center rounded-md border p-2">
              <input
                type="file"
                className="invisible h-1 w-0"
                accept="image/*"
                onChange={e => onUpload(e.currentTarget)}
              />
              <span>Upload</span>
              <span className="material-icons ml-2 text-sm">upload</span>
            </label>
            {err ? <div className="text-red-500">{err}</div> : null}
          </div>
        </Input>
      </Row>
    </div>
  );
};

export default GeneralSettings;

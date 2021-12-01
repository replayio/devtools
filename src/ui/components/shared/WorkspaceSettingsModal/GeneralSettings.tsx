import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import hooks from "ui/hooks";
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
  image: string | undefined,
  maxSize: number,
  callback: (img: string) => void
) => {
  const [err, setErr] = useState<string>();
  const [img, setImg] = useState(image);

  const handleUpload = (input: HTMLInputElement) => {
    if (!input.files?.[0]) return;

    input.files[0].arrayBuffer().then(b => {
      if (maxSize && b.byteLength > maxSize * 1024) {
        setErr(`Image must be less than ${maxSize} kilobytes`);
        return;
      }

      const ua = new Uint8Array(b);
      const str = ua.reduce((a, b) => a + String.fromCharCode(b), "");
      const newImage = btoa(str);
      setErr(undefined);
      setImg(newImage);
      callback(newImage);
    });
  };

  return [img, err, handleUpload];
};

const GeneralSettings = ({ workspaceId }: { workspaceId: string }) => {
  const { workspace } = hooks.useGetWorkspace(workspaceId);
  const updateWorkspaceSettings = hooks.useUpdateWorkspaceSettings();
  const [img, err, handleUpload] = useImageUpload(workspace?.logo, 250, logo =>
    updateWorkspaceSettings({
      variables: {
        workspaceId,
        logo,
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
        <Input>
          <input
            className="rounded-md text-sm w-full"
            type="text"
            value={name}
            onChange={e => setName(e.currentTarget.value)}
          />
        </Input>
      </Row>
      <Row>
        <Label className="self-start">Logo</Label>
        <Input>
          <div className="flex flex-col items-start space-y-4">
            {img ? <img className="block max-h-12" src={`data:image/png;base64,${img}`} /> : null}
            <label className="cursor-pointer border rounded-md p-2 flex-inline items-center justify-center">
              <input
                type="file"
                className="invisible h-1 w-0"
                accept="image/png"
                onChange={e => handleUpload(e.currentTarget)}
              />
              <span>Upload</span>
              <span className="text-sm material-icons ml-2">upload</span>
            </label>
            {err ? <div className="text-red-500">{err}</div> : null}
          </div>
        </Input>
      </Row>
    </div>
  );
};

export default GeneralSettings;

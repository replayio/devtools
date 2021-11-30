import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import hooks from "ui/hooks";

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

const GeneralSettings = ({ workspaceId }: { workspaceId: string }) => {
  const { workspace } = hooks.useGetWorkspace(workspaceId!);
  const updateWorkspaceSettings = hooks.useUpdateWorkspaceSettings();
  const [name, setName] = useState(workspace?.name);
  const ref = useRef<NodeJS.Timeout | undefined>();

  useEffect(() => {
    if (ref.current) {
      clearTimeout(ref.current);
    }

    ref.current = setTimeout(() => {
      updateWorkspaceSettings({
        variables: {
          workspaceId,
          name: name,
        },
      });
    }, 500);
  }, [name]);

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
      {/* <Row>
        <Label>Logo</Label>
        <Input>
          <button className="border p-2 rounded-md">Upload</button>
        </Input>
      </Row> */}
    </div>
  );
};

export default GeneralSettings;

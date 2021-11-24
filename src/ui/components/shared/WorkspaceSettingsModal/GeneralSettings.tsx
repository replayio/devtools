import classNames from "classnames";
import React from "react";
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
  return <div className="flex py-4 items-center">{children}</div>;
};

const GeneralSettings = ({ workspaceId }: { workspaceId: string }) => {
  const { workspace } = hooks.useGetWorkspace(workspaceId!);

  return (
    <div>
      <Row>
        <Label>Name</Label>
        <Input>
          <input className="rounded-md text-sm w-full" type="text" value={workspace?.name} />
        </Input>
      </Row>
      <Row>
        <Label>Logo</Label>
        <Input>
          <button className="border p-2 rounded-md">Change</button>
        </Input>
      </Row>
      <Row>
        <div className="w-full relative">
          <div className="absolute w-full h-0 border-t top-1/2 z-0" />
          <div className="relative w-max mx-auto text-center bg-toolbarBackground z-10 px-4">
            Organization
          </div>
        </div>
      </Row>
      <Row>
        <Label>SSO</Label>
        <Input>
          <label className="flex items-center" htmlFor="restrict_users_to_domain">
            <input
              className="rounded-sm mr-2 text-sm"
              type="checkbox"
              id="restrict_users_to_domain"
              name="restrict_users_to_domain"
            />
            <span>Limit users to {workspace?.domain}</span>
          </label>
        </Input>
      </Row>
      <Row>
        <Label>Allow Recordings From</Label>
        <Input>
          <input
            placeholder={`staging.${workspace?.domain}`}
            type="text"
            className="rounded-md text-sm w-full"
          />
        </Input>
      </Row>
      <Row>
        <Label>Block Recordings From</Label>
        <Input>
          <input
            placeholder={`production.${workspace?.domain}`}
            type="text"
            className="rounded-md text-sm w-full"
          />
        </Input>
      </Row>
      <Row>
        <Label className="self-start">Welcome Message</Label>
        <textarea className="rounded-md w-full" />
      </Row>
    </div>
  );
};

export default GeneralSettings;

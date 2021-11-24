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
  const { data } = hooks.useGetWorkspaceSubscription(workspaceId);

  if (!(workspace && data)) {
    return null;
  }

  const { subscription } = data?.node;
  const disabled = subscription.plan.key !== "org-v1";

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
          <button className="border p-2 rounded-md">Upload</button>
        </Input>
      </Row>
      <div className={classNames({ "text-gray-500": disabled })}>
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
                className={classNames("rounded-sm mr-2 text-sm", {
                  "bg-toolbarBackground": disabled,
                  "border-gray-300": disabled,
                })}
                disabled={disabled}
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
              className={classNames("rounded-md mr-2 w-full text-sm", {
                "bg-toolbarBackground": disabled,
                "border-gray-300": disabled,
              })}
              disabled={disabled}
              placeholder={`staging.${workspace?.domain}`}
              type="text"
            />
          </Input>
        </Row>
        <Row>
          <Label>Block Recordings From</Label>
          <Input>
            <input
              disabled={disabled}
              placeholder={`production.${workspace?.domain}`}
              type="text"
              className={classNames("rounded-md w-full mr-2 text-sm", {
                "bg-toolbarBackground": disabled,
                "border-gray-300": disabled,
              })}
            />
          </Input>
        </Row>
        <Row>
          <Label className="self-start">Welcome Message</Label>
          <textarea
            disabled={disabled}
            className={classNames("rounded-md w-full mr-2 text-sm", {
              "bg-toolbarBackground": disabled,
              "border-gray-300": disabled,
            })}
          />
        </Row>
      </div>
    </div>
  );
};

export default GeneralSettings;

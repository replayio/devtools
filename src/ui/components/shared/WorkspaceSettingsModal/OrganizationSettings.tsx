import { QuestionMarkCircleIcon } from "@heroicons/react/outline";
import classNames from "classnames";
import React, { useEffect } from "react";

import { PartialWorkspaceSettingsFeatures } from "shared/graphql/types";
import hooks from "ui/hooks";

import useDebounceState from "./useDebounceState";
import { sanitizeUrlList } from "./utils";

function CSVInput({
  disabled,
  id,
  value,
  onChange,
}: {
  disabled: boolean;
  id: string;
  value?: string;
  onChange: (value: string[]) => void;
}) {
  const [currentValue, setCurrentValue] = useDebounceState(value, v =>
    onChange(sanitizeUrlList(v))
  );

  return (
    <textarea
      id={id}
      className={classNames("h-20 w-full rounded-md text-sm", {
        "bg-themeTextFieldBgcolor": disabled,
        "border-inputBorder": disabled,
      })}
      disabled={disabled}
      onChange={e => setCurrentValue(e.currentTarget.value)}
      value={currentValue}
    />
  );
}

const Label = ({
  className,
  children,
  help,
}: {
  className?: string;
  children: React.ReactNode;
  help?: string;
}) => {
  return (
    <div className={classNames(className, "w-5/12 flex-shrink-0 justify-between space-x-2")}>
      <label>{children}</label>
      {help ? (
        <span title={help}>
          <QuestionMarkCircleIcon className="h-4 w-4" />
        </span>
      ) : null}
    </div>
  );
};

const Input = ({ children }: { children: React.ReactNode }) => {
  return <div className="w-8/12">{children}</div>;
};

const Row = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex items-center space-x-2">{children}</div>;
};

const OrganizationSettings = ({ workspaceId }: { workspaceId: string }) => {
  const { workspace, loading } = hooks.useGetWorkspace(workspaceId);
  const updateWorkspaceSettings = hooks.useUpdateWorkspaceSettings();
  const [message, setMessage, resetMessage] = useDebounceState(
    workspace?.settings?.motd || undefined,
    motd =>
      updateWorkspaceSettings({
        variables: {
          workspaceId,
          motd,
        },
      })
  );

  const features: PartialWorkspaceSettingsFeatures = workspace?.settings?.features || {};
  const updateFeature = (features: PartialWorkspaceSettingsFeatures) => {
    updateWorkspaceSettings({
      variables: {
        workspaceId,
        features,
      },
    });
  };

  useEffect(() => {
    if (workspace) {
      resetMessage(workspace.settings?.motd || "");
    }
    // workspace can referentially change from polling for changes without the
    // workspace actually having changed so we're tying this hook invocation to
    // the id change which will indicate when the workspace becomes loaded (or if
    // a new workspace is somehow selected) eslint-disable-line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id, resetMessage]);

  if (!workspace) {
    return null;
  }

  const disabled = !workspace.isOrganization;

  return (
    <div
      className={classNames("-mr-4 max-h-full space-y-4 overflow-y-auto pr-4", {
        "text-gray-500": disabled,
      })}
    >
      {disabled ? (
        <p>
          These features are only available to teams on our Organization Plan. Want to upgrade?{" "}
          <a
            href="mailto:sales@replay.io"
            rel="noreferrer noopener"
            target="_blank"
            className="underline"
          >
            Get in touch!
          </a>
        </p>
      ) : null}
      <div className="text-xs font-semibold uppercase">Recordings</div>
      <Row>
        <Label>Disable Public Recordings</Label>
        <Input>
          <label className="flex items-center" htmlFor="disable_public_recordings">
            <input
              className={classNames("ml-0 rounded-sm text-sm", {
                "bg-themeTextFieldBgcolor": disabled,
                "border-inputBorder": disabled,
              })}
              disabled={disabled}
              type="checkbox"
              id="disable_public_recordings"
              name="disable_public_recordings"
              onChange={e => updateFeature({ recording: { public: !e.currentTarget.checked } })}
              checked={!features?.recording?.public}
            />
          </label>
        </Input>
      </Row>

      <Row>
        <Label
          className="flex flex-row items-center self-start"
          help="If set, any recorded URL must match at least one of these domains."
        >
          Allow Recordings From
        </Label>
        <Input>
          <CSVInput
            id="allow_list"
            value={features?.recording?.allowList?.join(", ")}
            disabled={disabled}
            onChange={allowList => updateFeature({ recording: { allowList } })}
          />
        </Input>
      </Row>
      <Row>
        <Label
          className="flex flex-row items-center self-start"
          help="If set, any recorded URL must not match any of these domains."
        >
          Block Recordings From
        </Label>
        <Input>
          <CSVInput
            id="block_list"
            value={features?.recording?.blockList?.join(", ")}
            disabled={disabled}
            onChange={blockList => updateFeature({ recording: { blockList } })}
          />
        </Input>
      </Row>
      <div className="text-xs font-semibold uppercase">Members</div>
      <Row>
        <Label>Disable My Library</Label>
        <Input>
          <label className="flex items-center" htmlFor="restrict_users_to_domain">
            <input
              className={classNames("ml-0 rounded-sm text-sm", {
                "bg-themeTextFieldBgcolor": disabled,
                "border-inputBorder": disabled,
              })}
              disabled={disabled}
              type="checkbox"
              id="restrict_users_to_domain"
              name="restrict_users_to_domain"
              checked={!features?.user?.library}
              onChange={e => updateFeature({ user: { library: !e.currentTarget.checked } })}
            />
          </label>
        </Input>
      </Row>
      <Row>
        <Label>Automatically Add Users</Label>
        <Input>
          <label className="flex items-center" htmlFor="auto_add_users">
            <select
              className={classNames("ml-0 rounded-sm text-sm", {
                "bg-themeTextFieldBgcolor": disabled,
                "border-inputBorder": disabled,
              })}
              disabled={disabled}
              id="auto_add_users"
              name="auto_add_users"
              value={features?.user?.autoJoin || 0}
              onChange={e =>
                updateFeature({
                  user: {
                    autoJoin: Number(e.currentTarget.selectedOptions.item(0)?.value) || null,
                  },
                })
              }
            >
              <option value="0">None</option>
              <option value="1">Viewer</option>
              <option value="3">Developer</option>
              <option value="131">Admin</option>
            </select>
          </label>
        </Input>
      </Row>
      {/* <Row>
        <Label>Limit users to {workspace?.domain}</Label>
        <Input>
          <label className="flex items-center" htmlFor="restrict_users_to_domain">
            <input
              className={classNames("rounded-sm ml-0 text-sm", {
                "bg-themeTextFieldBgcolor": disabled,
                "border-gray-300": disabled,
              })}
              disabled={disabled}
              type="checkbox"
              id="restrict_users_to_domain"
              name="restrict_users_to_domain"
            />
          </label>
        </Input>
      </Row> */}
      <Row>
        <Label className="self-start">Welcome Message</Label>
        <div>
          <textarea
            className={classNames("h-20 w-full rounded-md text-sm", {
              "bg-themeTextFieldBgcolor": disabled,
              "border-inputBorder": disabled,
            })}
            disabled={disabled}
            onChange={e => setMessage(e.currentTarget.value)}
            value={message}
          />
          {disabled ? null : (
            <a href="/browser/new-tab" rel="noreferrer noopener" target="_blank">
              Preview
            </a>
          )}
        </div>
      </Row>
    </div>
  );
};

export default OrganizationSettings;

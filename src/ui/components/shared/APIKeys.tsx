import React, { useEffect, useMemo, useRef, useState } from "react";
import { ApiKey, ApiKeyResponse, ApiKeyScope } from "ui/types";
import { useConfirm } from "./Confirm";

import TextInput from "./Forms/TextInput";
import MaterialIcon from "./MaterialIcon";

const scopeLabels: Record<ApiKeyScope, string> = {
  "admin:all": "Create recordings",
  "write:sourcemap": "Upload source maps",
};

function NewApiKey({ keyValue, onDone }: { keyValue: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copied, setCopied]);

  return (
    <>
      <div className="flex items-center justify-between space-x-3">
        <div className="w-0 flex-auto">
          <div className="flex h-9 w-full items-center rounded-md border border-textFieldBorder bg-blue-100 px-2.5">
            <input
              readOnly
              value={keyValue}
              className="flex-auto truncate bg-blue-100 focus:outline-none"
              onFocus={ev => ev.target.setSelectionRange(0, keyValue.length)}
            />
            {copied ? (
              <div className="mx-3 text-primaryAccent">Copied!</div>
            ) : (
              <MaterialIcon
                className="material-icons mx-2.5 w-5 text-primaryAccent"
                iconSize="lg"
                onClick={() => navigator.clipboard.writeText(keyValue!).then(() => setCopied(true))}
              >
                assignment_outline
              </MaterialIcon>
            )}
          </div>
        </div>
        <button
          className="inline-flex h-9 items-center rounded-md border border-transparent bg-primaryAccent px-2.5 py-1.5 font-medium leading-4 text-white shadow-sm hover:bg-primaryAccentHover focus:bg-primaryAccentHover focus:outline-none"
          onClick={onDone}
        >
          Done
        </button>
      </div>
      <div className="flex items-center rounded-md border border-textFieldBorder bg-red-100 p-2.5">
        Make sure to copy your API key now. You won{"'"}t be able to see it again!
      </div>
    </>
  );
}

function ApiKeyList({ apiKeys, onDelete }: { apiKeys: ApiKey[]; onDelete: (id: string) => void }) {
  const { confirmDestructive } = useConfirm();
  if (apiKeys.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-auto flex-col">
      <h3 className="text-base font-semibold uppercase">API Keys</h3>
      <div className="h-0 flex-auto overflow-auto">
        {apiKeys.map(apiKey => {
          const usage =
            typeof apiKey.maxRecordings === "number"
              ? `(${apiKey.recordingCount} / ${apiKey.maxRecordings} recordings)`
              : `(${apiKey.recordingCount} recordings)`;
          return (
            <div className="flex flex-row items-center py-1.5" key={apiKey.id}>
              <span className="flex-auto" data-private>
                {apiKey.label}
                <span className="ml-2 text-gray-500">{usage}</span>
              </span>
              <button
                className="inline-flex items-center rounded-md bg-gray-100 p-2.5 text-sm leading-4 text-red-500 shadow-sm hover:text-red-700 focus:text-red-700 focus:outline-none"
                onClick={() => {
                  confirmDestructive({
                    message: "Delete API key?",
                    description:
                      "This action will permanently delete this API key. \n\nAre you sure you want to proceed?",
                    acceptLabel: "Delete API key",
                  }).then(confirmed => {
                    if (confirmed) {
                      onDelete(apiKey.id);
                    }
                  });
                }}
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function APIKeys({
  apiKeys,
  description,
  error,
  loading,
  addKey,
  deleteKey,
  scopes = [],
}: {
  apiKeys: ApiKey[];
  scopes?: ApiKeyScope[];
  description: string;
  error: any;
  loading: boolean;
  addKey: (label: string, scopes?: ApiKeyScope[]) => Promise<ApiKeyResponse>;
  deleteKey: (id: string) => void;
}) {
  const labelRef = useRef<HTMLInputElement>(null);
  const [keyValue, setKeyValue] = useState<string>();
  const [selectedScopes, selectScopes] = useState<ApiKeyScope[]>(scopes);
  const [label, setLabel] = useState<string>("");

  const canSubmit = label && !loading && selectedScopes.length > 0;
  const sortedKeys = useMemo(
    () =>
      [...apiKeys].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [apiKeys]
  );

  // focus the input on mount (when the ref is valued) and when returning to the
  // form (when keyValue changes)
  useEffect(() => {
    labelRef.current?.focus();
  }, [labelRef.current, keyValue]);

  return (
    <div className="flex h-0 flex-auto flex-col space-y-8">
      <label className="setting-item">
        <div className="description">{description}</div>
      </label>
      {error ? (
        <div>Unable to add an API key at this time. Please try again later.</div>
      ) : keyValue ? (
        <NewApiKey keyValue={keyValue} onDone={() => setKeyValue(undefined)} />
      ) : (
        <>
          <section className="space-y-2.5 text-sm">
            <h3 className="text-xs font-semibold uppercase">Create new API Key</h3>
            <form
              className="space-y-3"
              onSubmit={ev => {
                canSubmit &&
                  addKey(label, selectedScopes).then(resp => {
                    selectScopes(scopes);
                    setKeyValue(resp.keyValue);
                    setLabel("");
                  });

                ev.preventDefault();
              }}
            >
              <fieldset className="flex w-full flex-row space-x-1.5">
                <TextInput
                  disabled={loading}
                  placeholder="API Key Label"
                  onChange={e => setLabel((e.target as HTMLInputElement).value)}
                  ref={labelRef}
                  value={label}
                />
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`inline-flex items-center rounded-md border border-transparent bg-primaryAccent px-2.5 py-1.5 font-medium leading-4 text-white shadow-sm focus:outline-none ${
                    canSubmit
                      ? "hover:bg-primaryAccentHover focus:bg-primaryAccentHover"
                      : "opacity-60"
                  }`}
                >
                  Add
                </button>
              </fieldset>
              {scopes && scopes.length > 1 ? (
                <fieldset className="w-full">
                  <h4 className="text-sm font-semibold uppercase">Permissions</h4>
                  {scopes.map(scope => (
                    <label key={scope} className="mx-1.5 inline-block space-x-1.5">
                      <input
                        type="checkbox"
                        onChange={e =>
                          selectScopes(current => {
                            if ((e.target as HTMLInputElement).checked) {
                              return [...current, scope];
                            } else {
                              return current.filter(s => s !== scope);
                            }
                          })
                        }
                        checked={selectedScopes.includes(scope)}
                      />
                      <span>{scopeLabels[scope]}</span>
                    </label>
                  ))}
                  {selectedScopes.length === 0 ? (
                    <div className="mt-2.5 flex items-center rounded-md border border-textFieldBorder bg-red-100 p-2.5">
                      At least one permission must be selected.
                    </div>
                  ) : null}
                </fieldset>
              ) : null}
            </form>
          </section>
          <ApiKeyList
            apiKeys={sortedKeys}
            onDelete={id => {
              deleteKey(id);
              labelRef.current?.focus();
            }}
          />
        </>
      )}
    </div>
  );
}

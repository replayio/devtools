import React, { useEffect, useMemo, useRef, useState } from "react";
import { ApiKey, ApiKeyResponse, ApiKeyScope } from "ui/types";

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
        <div className="flex-auto w-0">
          <div className="flex items-center px-2.5 h-9 w-full border border-textFieldBorder rounded-md bg-blue-100">
            <input
              readOnly
              value={keyValue}
              className="bg-blue-100 flex-auto truncate focus:outline-none"
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
          className="inline-flex items-center px-2.5 py-1.5 h-9 border border-transparent leading-4 font-medium rounded-md shadow-sm text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:bg-primaryAccentHover"
          onClick={onDone}
        >
          Done
        </button>
      </div>
      <div className="flex items-center p-2.5 border border-textFieldBorder rounded-md bg-red-100">
        Make sure to copy your API key now. You won{"'"}t be able to see it again!
      </div>
    </>
  );
}

function ApiKeyList({ apiKeys, onDelete }: { apiKeys: ApiKey[]; onDelete: (id: string) => void }) {
  if (apiKeys.length === 0) return null;

  return (
    <section className="flex-auto flex flex-col">
      <h3 className="text-base uppercase font-semibold">API Keys</h3>
      <div className="flex-auto overflow-auto h-0">
        {apiKeys.map(apiKey => {
          const usage =
            typeof apiKey.maxRecordings === "number"
              ? `(${apiKey.recordingCount} / ${apiKey.maxRecordings} recordings)`
              : `(${apiKey.recordingCount} recordings)`;
          return (
            <div className="flex flex-row items-center py-1.5" key={apiKey.id}>
              <span className="flex-auto" data-private>
                {apiKey.label}
                <span className="text-gray-500 ml-2">{usage}</span>
              </span>
              <button
                className="inline-flex items-center p-2.5 text-sm shadow-sm leading-4 rounded-md bg-gray-100 text-red-500 hover:text-red-700 focus:outline-none focus:text-red-700"
                onClick={() => {
                  const message =
                    "This action will permanently delete this API key. \n\nAre you sure you want to proceed?";

                  if (window.confirm(message)) {
                    onDelete(apiKey.id);
                  }
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
    <div className="space-y-8 flex flex-col flex-auto h-0">
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
            <h3 className="uppercase font-semibold text-xs">Create new API Key</h3>
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
              <fieldset className="w-full space-x-1.5 flex flex-row">
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
                  className={`inline-flex items-center px-2.5 py-1.5 border border-transparent leading-4 font-medium rounded-md shadow-sm text-white bg-primaryAccent focus:outline-none ${
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
                  <h4 className="text-sm uppercase font-semibold">Permissions</h4>
                  {scopes.map(scope => (
                    <label key={scope} className="inline-block space-x-1.5 mx-1.5">
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
                    <div className="mt-2.5 flex items-center p-2.5 border border-textFieldBorder rounded-md bg-red-100">
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

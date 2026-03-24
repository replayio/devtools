import React, { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "replay-next/components/Button";
import { ApiKey, ApiKeyResponse, ApiKeyScope } from "shared/graphql/types";

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
          <div className="flex h-9 w-full items-center rounded-md border border-border bg-muted/40 px-2.5 text-sm text-foreground">
            <input
              readOnly
              value={keyValue}
              className="flex-auto truncate bg-transparent focus:outline-none"
              onFocus={ev => ev.target.setSelectionRange(0, keyValue.length)}
            />
            {copied ? (
              <div className="text-sm font-medium text-primaryAccent">Copied</div>
            ) : (
              <MaterialIcon
                className="material-icons h-5 w-5 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                iconSize="lg"
                onClick={() => navigator.clipboard.writeText(keyValue!).then(() => setCopied(true))}
              >
                assignment_outline
              </MaterialIcon>
            )}
          </div>
        </div>
        <Button variant="solid" onClick={onDone}>
          Done
        </Button>
      </div>
      <div className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
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
    <section className="flex flex-auto flex-col gap-3">
      <h3 className="text-sm font-medium text-foreground">Your API keys</h3>
      <div className="h-0 flex-auto divide-y divide-border overflow-auto rounded-md border border-border">
        {apiKeys.map(apiKey => {
          const usage =
            typeof apiKey.maxRecordings === "number"
              ? `(${apiKey.recordingCount} / ${apiKey.maxRecordings} recordings)`
              : `(${apiKey.recordingCount} recordings)`;
          return (
            <div
              className="flex flex-row items-center gap-3 py-3 pl-3 pr-2 first:pt-3 last:pb-3"
              key={apiKey.id}
            >
              <span className="min-w-0 flex-auto text-sm text-foreground">
                {apiKey.label}
                <span className="ml-2 text-muted-foreground">{usage}</span>
              </span>
              <button
                type="button"
                className="inline-flex shrink-0 items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

  // focus the input on mount and when returning to the form (when keyValue changes)
  useEffect(() => {
    labelRef.current?.focus();
  }, [keyValue]);

  return (
    <div className="flex h-0 flex-auto flex-col gap-8">
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      {error ? (
        <p className="text-sm text-destructive">
          Unable to add an API key at this time. Please try again later.
        </p>
      ) : keyValue ? (
        <NewApiKey keyValue={keyValue} onDone={() => setKeyValue(undefined)} />
      ) : (
        <>
          <section className="space-y-3 text-sm">
            <h3 className="text-base font-semibold text-foreground">Create API key</h3>
            <form
              className="space-y-4"
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
              <fieldset className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                <div className="min-w-0 flex-1">
                  <TextInput
                    disabled={loading}
                    placeholder="API key label"
                    onChange={e => setLabel((e.target as HTMLInputElement).value)}
                    ref={labelRef}
                    value={label}
                  />
                </div>
                <Button className="h-9 shrink-0" disabled={!canSubmit} variant="solid">
                  Add
                </Button>
              </fieldset>
              {scopes && scopes.length > 1 ? (
                <fieldset className="w-full space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Permissions</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {scopes.map(scope => (
                      <label key={scope} className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-border"
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
                        <span className="text-sm text-foreground">{scopeLabels[scope]}</span>
                      </label>
                    ))}
                  </div>
                  {selectedScopes.length === 0 ? (
                    <div className="rounded-md border border-destructive/25 bg-destructive/10 p-2.5 text-sm text-destructive">
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

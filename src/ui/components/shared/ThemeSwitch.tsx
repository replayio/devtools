import { useEffect, useRef, useState } from "react";

import { Theme } from "shared/theme/types";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";

const themes: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeSwitch() {
  const [theme, setPreference] = useGraphQLUserData("global_theme");
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = themes.find(t => t.value === theme) ?? themes[2];

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div className="flex items-center justify-between border-b border-border py-4">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium text-foreground">Theme</div>
        <div className="text-sm text-muted-foreground">Choose your preferred appearance</div>
      </div>

      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex min-w-[160px] cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-ring"
        >
          <span>{current.label}</span>
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-full min-w-[160px] rounded-md border border-border bg-card py-1 shadow-lg">
            {themes.map(t => (
              <button
                type="button"
                key={t.value}
                onClick={() => {
                  void setPreference(t.value);
                  setIsOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm text-foreground transition-colors ${
                  theme === t.value ? "bg-accent" : "hover:bg-accent"
                }`}
              >
                <span>{t.label}</span>
                {theme === t.value && (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

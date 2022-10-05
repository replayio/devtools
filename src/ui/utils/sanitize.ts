import { Pause, ValueFront } from "protocol/thread";
import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { UIState } from "ui/state";
import { UIAction } from "ui/actions";

const forbiddenClasses: Record<string, any> = {
  Pause,
  ValueFront,
};

const excludedActions = [
  "SET_SYMBOLS",
  "START_PREVIEW",
  "COMPLETE_PREVIEW",
  "UPDATE_RULES",
  "set_computed_properties",
];

const loggedCategories = new Set<string>();

export function sanitize(obj: any, path: string, category: string, logSanitized: boolean): any {
  for (const name in forbiddenClasses) {
    if (obj instanceof forbiddenClasses[name]) {
      if (logSanitized && !loggedCategories.has(category)) {
        console.warn(`${category}${path} is of type ${name}`);
        loggedCategories.add(category);
      }
      return undefined;
    }
  }
  if (Array.isArray(obj)) {
    return obj.map((item, i) => sanitize(item, `${path}[${i}]`, category, logSanitized));
  }
  if (typeof obj === "object" && !(obj instanceof HTMLElement)) {
    const sanitized: Record<string, any> = {};
    for (const key in obj) {
      sanitized[key] = sanitize(obj[key], `${path}.${key}`, category, logSanitized);
    }
    return sanitized;
  }
  return obj;
}

export function sanitizeAction(action: any, logSanitized: boolean) {
  if (excludedActions.includes(action.type)) {
    return { type: action.type };
  }
  return sanitize(action, "", `action[${action.type}]`, logSanitized);
}

export const sanityCheckMiddleware: Middleware<{}, UIState, Dispatch<UIAction>> =
  store => next => action => {
    sanitizeAction(action, false);
    return next(action);
  };

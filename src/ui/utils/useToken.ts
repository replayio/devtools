import cookie from "cookie";
import { useEffect, useState } from "react";
import { usesWindow } from "ssr";

type TokenListener = (token: string | null) => void;
let gToken: string | null;
let listeners = new Set<TokenListener>();

export const addListener = (listener: TokenListener) => {
  listeners.add(listener);
};

export const removeListener = (listener: TokenListener) => {
  listeners.delete(listener);
};

const notifyListeners = () => {
  for (let l of listeners.values()) {
    l(gToken);
  }
};

export const getToken = () => {
  const cookies = usesWindow(win => (win ? cookie.parse(document.cookie) : {}));

  gToken = cookies["replay_session"] || null;

  return gToken;
};

export default function useToken() {
  const [token, setToken] = useState<string | null>(getToken());

  useEffect(() => {
    if (token !== gToken) {
      gToken = token;
      notifyListeners();
    }
  }, [token]);

  return { token, setToken };
}

import { useEffect, useState } from "react";

import tokenManager, { TokenState } from "./tokenManager";

const DEFAULT_STATE = { loading: true };

export default function useToken() {
  const [tokenState, setTokenState] = useState<TokenState>(
    tokenManager.getState() || DEFAULT_STATE
  );

  useEffect(() => {
    const listener = (state: TokenState) => setTokenState(state);
    tokenManager.addListener(listener);
    return () => {
      tokenManager.removeListener(listener);
    };
  }, []);

  return tokenState;
}

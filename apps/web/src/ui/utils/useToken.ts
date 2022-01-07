import { useEffect, useState } from "react";
import tokenManager, { TokenState } from "./tokenManager";

export default function useToken() {
  const [tokenState, setTokenState] = useState<TokenState>({ loading: true });

  useEffect(() => {
    const listener = (state: TokenState) => setTokenState(state);
    tokenManager.addListener(listener);
    return () => {
      tokenManager.removeListener(listener);
    };
  }, []);

  return tokenState;
}

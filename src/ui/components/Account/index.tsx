import React, { useEffect } from "react";
import { useRouter } from "next/router";

import useAuth0 from "ui/utils/useAuth0";

import Library from "../Library/index";
import Login from "../shared/Login/Login";

/**
 * Create a (host relative) URL with the given parameters. Used for replacing
 * legacy routes with their current equivalents.
 */
function createReplayURL(currentParams: URLSearchParams) {
  const recordingId = currentParams.get("id");
  const path = recordingId ? `/recording/${recordingId}` : "/";
  const newParams = new URLSearchParams();
  currentParams.forEach((value, key) => {
    if (key !== "id") {
      newParams.set(key, value);
    }
  });
  return `${path}?${newParams.toString()}`;
}

export default function Account() {
  const { isLoading, isAuthenticated } = useAuth0();
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);

  useEffect(() => {
    if (searchParams.get("id")) {
      router.replace(createReplayURL(searchParams));
    }
  }, []);

  if (isLoading || searchParams.get("id")) {
    return null;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Library />;
}

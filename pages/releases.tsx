import { platform } from "os";
import { useEffect, useMemo, useState } from "react";

export default function Releases() {
  const [releases, setReleases] = useState([]);
  useEffect(() => {
    fetch("/api/releases").then(async res => setReleases(JSON.parse(await res.text())));
  }, []);

  const latestReleases = useMemo(() => {
    const latest: any = {};
    for (const release of releases) {
      const { runtime, platform } = release;
      const key = `${runtime}-${platform}`;
      if (!latest[key]) {
        latest[key] = release;
      }
    }
    return latest;
  }, [releases]);

  return <pre>{JSON.stringify(latestReleases, null, 2)}</pre>;
}

import { platform } from "os";
import { useEffect, useMemo, useState } from "react";

export default function Releases() {
  const [releases, setReleases] = useState([]);
  const [showAll, setShowAll] = useState(true);
  useEffect(() => {
    fetch("/api/releases").then(async res => setReleases(JSON.parse(await res.text()) as any));
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

  return (
    <div className="mx-10 overflow-auto px-4 sm:px-6 lg:px-8">
      <div className="flex w-full items-center justify-between py-2 ">
        <h1 className="text-xl font-semibold text-gray-900">Latest Releases</h1>
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="inline-flex   rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
        >
          {showAll ? "Show Latest" : "Show All"}
        </button>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Runtime
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Platform
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Channel
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Build
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Deploy
                    </th>

                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-left sm:pr-6">
                      <span className="sr-only">Download</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {Object.values(showAll ? releases : latestReleases).map((release: any) => (
                    <tr key={release.buildFile}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {release.runtime}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {release.platform}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {release.channel}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {release.buildId}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(release.time).toLocaleString()}
                      </td>

                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-sm font-medium sm:pr-6">
                        <a
                          href={`https://static.replay.io/downloads/${release.buildFile}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

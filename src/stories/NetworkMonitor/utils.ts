import { RequestInfo, RequestEventInfo } from "@recordreplay/protocol";

export const eventsFor = (
  id: string,
  url: string,
  status: number,
  method: string
): RequestEventInfo[] => {
  return [
    {
      id,
      time: 0,
      event: {
        kind: "request",
        requestCause: "app.js:31",
        requestHeaders: [
          { name: "Host", value: "www.paypal.com" },
          {
            name: "User-Agent",
            value:
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.16; rv:86.0) Gecko/20100101 Firefox/86.0",
          },
          { name: "Accept", value: "application/json" },
          { name: "Accept-Language", value: "en-US,en;q=0.5" },
          { name: "Accept-Encoding", value: "gzip, deflate, br" },
          { name: "content-type", value: "application/json" },
          { name: "Content-Length", value: "1440" },
        ],
        requestMethod: method,
        requestUrl: url,
      },
    },
    {
      id,
      time: Math.floor(1000 * Math.random()),
      event: {
        kind: "response",
        responseFromCache: false,
        responseHeaders: [
          { name: "cache-control", value: "max-age=0, no-cache, no-store, must-revalidate" },
          { name: "content-type", value: "image/gif" },
          { name: "expires", value: "Sat, 13 Nov 2021 16:05:38 GMT" },
          {
            name: "p3p",
            value:
              'policyref="https://t.paypal.com/w3c/p3p.xml",CP="CAO IND OUR SAM UNI STA COR COM"',
          },
          { name: "paypal-debug-id", value: "f5f7b78d1f30e" },
          { name: "pragma", value: "no-cache" },
          { name: "accept-ranges", value: "bytes" },
          { name: "via", value: "1.1 varnish, 1.1 varnish" },
          { name: "date", value: "Sat, 13 Nov 2021 16:05:38 GMT" },
          {
            name: "strict-transport-security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { name: "x-served-by", value: "cache-lax10625-LGB, cache-pao17450-PAO" },
          { name: "x-cache", value: "MISS, MISS" },
          { name: "x-cache-hits", value: "0, 0" },
          { name: "x-timer", value: "S1636819538.108041,VS0,VE84" },
          { name: "set-cookie", value: "x-cdn=0033; Domain=paypal.com; Path=/; Secure" },
          { name: "content-length", value: "42" },
          { name: "X-Firefox-Spdy", value: "h2" },
        ],
        responseProtocolVersion: "1",
        responseStatus: status,
        responseStatusText: "test",
      },
    },
  ];
};

export const requestProps = (
  id: string,
  url: string,
  status: number,
  method: string = "GET"
): { events: RequestEventInfo[]; info: RequestInfo } => {
  return {
    events: eventsFor(id, url, status, method),
    info: {
      id,
      time: Number(id),
      point: "1",
      triggerPoint: undefined,
    },
  };
};

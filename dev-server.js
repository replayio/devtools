const url = require("url");
const http = require("http");
const path = require("path");
const fs = require("fs");
const next = require("next");

const ContentTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

const app = next({ dev: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((req, res) => {
      const parsedUrl = url.parse("http://localhost:8080" + req.url, true);
      const pathname = parsedUrl.pathname;
      if (pathname.startsWith("/test/")) {
        const ext = pathname.substring(pathname.lastIndexOf("."));
        res.writeHead(200, {
          "Content-Type": ContentTypes[ext] || "text/plain",
        });
        fs.createReadStream(path.join(__dirname, pathname)).pipe(res);
      } else {
        handle(req, res, parsedUrl);
      }
    })
    .listen(8080, err => {
      if (err) {
        throw err;
      }
      console.log("> Ready on http://localhost:8080");
    });
});

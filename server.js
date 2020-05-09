/* Copyright 2020 Brian Hackett */

const fs = require("fs");
const http = require("http");
const port = 7997;

const server = http.createServer((request, response) => {
  try {
    const url = request.url.substring(1) || "index.html";
    const content = fs.readFileSync(url);
    response.writeHead(200, { "Content-Type": getContentType(request.url) });
    response.end(content);
  } catch (e) {
    response.writeHead(404);
    response.end();
  }
});
server.listen(port);
console.log(`Listening at http://localhost:${port}`);

function getContentType(url) {
  // return url.endsWith(".js") ? "text/javascript" : "";
  if (url.endsWith(".svg")) {
    return "image/svg+xml";
  }
  if (url.endsWith(".js")) {
    return "text/javascript";
  }
  return "";
}

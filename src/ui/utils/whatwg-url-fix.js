const { usesWindow } = require("../../ssr");

// whatwg-url.js depends on SharedArrayBuffer.prototype.byteLength having a getter,
// but SharedArrayBuffer is not always available in browsers for security reasons
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer/Planned_changes#api_changes
// and https://github.com/jsdom/whatwg-url/blob/a96b4f93f2338aad01b21160d9ceb6eea628942b/live-viewer/index.html#L7-L16
usesWindow(win => {
  if (win && !win.SharedArrayBuffer) {
    win.SharedArrayBuffer = {
      prototype: {
        get byteLength() {},
      },
    };
  }
});

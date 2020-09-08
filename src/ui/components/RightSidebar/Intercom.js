import React, { useEffect } from "react";
import ReactDOM from "react-dom";

import "./Intercom.css";
const APP_ID = "k7f741xx";
const CONFIG = {
  app_id: APP_ID,
  hide_default_launcher: true,
  custom_launcher_selector: ".intercom-launcher",
};

function bootstrapIntercom() {
  // We pre-filled your app ID in the widget URL: 'https://widget.intercom.io/widget/k7f741xx'
  var w = window;
  var ic = w.Intercom;
  if (typeof ic === "function") {
    ic("reattach_activator");
    ic("update", w.intercomSettings);
  } else {
    var d = document;
    var i = function () {
      i.c(arguments);
    };
    i.q = [];
    i.c = function (args) {
      i.q.push(args);
    };
    w.Intercom = i;
    var l = function () {
      var s = d.createElement("script");
      s.type = "text/javascript";
      s.async = true;
      s.src = `https://widget.intercom.io/widget/${APP_ID}`;
      s.onload = setupIntercom;
      var x = d.getElementsByTagName("script")[0];
      x.parentNode.insertBefore(s, x);
    };
    if (w.attachEvent) {
      w.attachEvent("onload", l);
    } else {
      w.addEventListener("load", l, false);
    }
  }
}

function setupIntercom() {
  const launcher = document.querySelector(".intercom-launcher");
  const unreadCount = launcher.querySelector(".intercom-unread-count");

  window.Intercom("boot", CONFIG);
  window.Intercom("onShow", () => launcher.classList.add("intercom-open"));
  window.Intercom("onHide", () => launcher.classList.remove("intercom-open"));

  window.Intercom("onUnreadCountChange", count => {
    unreadCount.textContent = count;
    if (count) {
      unreadCount.classList.add("active");
    } else {
      unreadCount.classList.remove("active");
    }
  });

  // Wait for Intercom to boot (max 30 seconds)
  const timeout = setTimeout(() => clearInterval(interval), 30000);
  const interval = setInterval(() => {
    if (window.Intercom.booted) {
      // Add class to show the launcher
      launcher.classList.add("intercom-booted");

      clearInterval(interval);
      clearTimeout(timeout);
    }
  }, 100);
}

export default function Intercom({}) {
  useEffect(() => bootstrapIntercom(), []);
  const intercomMailLink = `mailto:${APP_ID}@incoming.intercom.io`;
  return (
    <a className="intercom-launcher" href={intercomMailLink}>
      <div className="intercom-icon-close"></div>
      <div className="intercom-icon-open"></div>
      <span className="intercom-unread-count"></span>
    </a>
  );
}

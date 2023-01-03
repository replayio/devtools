import { createElement } from "react";

import {
  ProtocolMessage,
  RequestResponse,
  SocketError,
  SocketWillClose,
} from "../ProtocolMessagesStore";
import { EventHeaderRenderer, EventRenderer } from "./EventRenderer";
import { RequestResponseHeaderRenderer, RequestResponseRenderer } from "./RequestResponseRenderer";
import { SocketErrorHeaderRenderer, SocketErrorRenderer } from "./SocketErrorRenderer";
import { SocketWillCloseHeaderRenderer, SocketWillCloseRenderer } from "./SocketWillCloseRenderer";

export function getHeaderMessageRenderer(message: ProtocolMessage) {
  switch (message.type) {
    case "Event":
      return createElement(EventHeaderRenderer, { message: message as Event });
    case "RequestResponse":
      return createElement(RequestResponseHeaderRenderer, { message: message as RequestResponse });
    case "SocketError":
      return createElement(SocketErrorHeaderRenderer, { message: message as SocketError });
    case "SocketWillClose":
      return createElement(SocketWillCloseHeaderRenderer, { message: message as SocketWillClose });
  }
}

export function getMessageRenderer(message: ProtocolMessage) {
  switch (message.type) {
    case "Event":
      return createElement(EventRenderer, { message: message as Event });
    case "RequestResponse":
      return createElement(RequestResponseRenderer, { message: message as RequestResponse });
    case "SocketError":
      return createElement(SocketErrorRenderer, { message: message as SocketError });
    case "SocketWillClose":
      return createElement(SocketWillCloseRenderer, { message: message as SocketWillClose });
  }
}

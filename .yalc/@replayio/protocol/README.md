# Protocol

This package provides the type definitions of the protocol used by the Record Replay
WebSocket JSON-RPC web service, along with a simple wrapper JS/TS library for more
easily using the methods of the protocol as JS methods, rather than having a single
`sendCommand(name, arg)` API. Users of this API are still required to implement
the underlying JSON-RPC serialization and parsing themselves.

## JSON

This package also provides a JSON file containing the definitions of the protocol,
so that it may be used to generate bindings for other languages as well.

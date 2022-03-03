...tl;dr of how things work in general and some basic structure

# `Pause` and regions

`Pause` is a block of data from this pause which might be useful to the protocol client (frontend).

To reduce the number of back-and-forth calls required over the protocol, data which wasn't specifically asked for can be returned by commands or events.

It consists of:

- frames: `Frame[]`
- scopes: `Scope[]`
- objects: `Object[]`

This is a highest-level object from which, and through which, all of the additional details about the recording are derrived.

A recording can be viewed as a collection of different objects (`Frame`s, `Scope`s and `Objects`, `Resources`,...) that have different lifetimes throughout the entire duration of the recording, and a single "pause" reflects object alive at one particular point in time. A "region" is an entire interval of time (and not just a single point in time) that represents objects alive during that period of time. So throughout the entire duration of the recording, many diffferent objects come to life and get destroyed, and a regions is a subset of those for a particular interval of time, and a "pause" an even smaller subset of those.

An entire recording has way too many objects that go in and out of existence and carry too many details for us to be able to hold all of that information in the memory at once. And that's why every recording is split into "regions" - smaller chunks of data that can be transmitted over network and stored in memory on the client, and further data derived from and interacted with. "Regions" are not something that user ever particularly cares about (beside being forced to wait for them to be loaded) and that they interact with, and instead, the user interacts with "pauses". A "pause" is that single moment in time for which the user can inspect the state of the application.

A single `Pause` exists for each JS instruction. (TODO explain this and how it's related to debug stepping and `ExecutionPoint`s)

(defined in `node_modules/@recordreplay/protocol/js/protocol/Pause.d.ts`, client implementation in `src/protocol/thread/pause.ts`)

# `Frame`

Description of a stack frame.

Types of frame: call, global, module, or eval.

A single `Frame` can have multiple `Scope`s.

A frame is not something that the user interacts with and is used to derive further information that the user can and wants to interacts with.

(in `node_modules/@recordreplay/protocol/js/protocol/Pause.d.ts`)

# `Scope`

Description of a scope.

Types of scope can be: global, with, function, or block.

_Global_ and _with_ scopes have an underlaying `Object` associated with them, a _function_ scope has a function associated with it.

Scope is simply a collection of (named) values which are more or less an `Object`. Thus, a scope is a subset of `Object`s, and every `Object` belongs to one `Scope`s. Because JavaScript is lexically scoped, scopes create a tree-like structure in which all objects can be found.

Scope is what the users want to often interact with and inspect, as it can tell them information such as "what's the value of a particular variable while some function was executing" and "if a variable was shadowed by some other".

(in `node_modules/@recordreplay/protocol/js/protocol/Pause.d.ts`)

# `Object` and `ObjectPreview`

`Object` is a description of any JS object or a type.

`ObjectPreview` is an actual description of some or all `Object`'s contents.

(in `node_modules/@recordreplay/protocol/js/protocol/Pause.d.ts`)

# `Wired` types

...TODO

# `...Front` types

`Front` types are wrappers that combine raw data coming from the protocol (`Wired` types), their client representation (something that this codebase can easily work with and perhaps render) and interactions with those objects.

Motivation: `Wired` types and `Object` are too abstract and cannot be repsented in the UI nor interacted with, so an additional layer is added to specialize types and add interactions (methods). But some of the interactions cannot be calculated only locally, and actually need to communicate with the backend to retrieve the additional data, so this layer serves that dual purpose of being a bridge between very raw remote values and something that the frontend can make sense of.

(see `protocol/thread/**` for various `Front` implementations)

# `Reps`

`Reps` (representations) are components for rendering a specific native JS types or an object. Their primary input is a `ValueFront` and they render a component based on the type it represents.

(see `../reps/rep.js` for a full list of available components)

# `Grip`

`Grip` is client representation of remote JS object.

...TODO

# Object Inspector

`Object Inspector` (`OI`) is used to display a value of a certain JS object whose entire content is only loaded through user interactions, where the user expands the object progressively and loads further pieces of the content one by one.

It's mostly used in Console and Editor, so that the user can inspect the value of an object:

https://user-images.githubusercontent.com/1355455/156434746-a9656732-0d20-4a83-ba14-62373637d39a.mp4

<img width="418" alt="image" src="https://user-images.githubusercontent.com/1355455/156566684-8eba49d5-cb53-4952-9d38-5ae463ca0288.png">

`OI` doesn't load all of its content immediately, and, instead, it progressively collects more data as you interact with it in the UI.

It works by coalescing several different types within its implementation that each know how to render themselves (see `Item` type in `src/devtools/packages/devtools-reps/object-inspector/utils/index.ts`) and it heavily relies on `Reps` to actually render sub-trees of an object's content. The main difference between `Reps` and `OI` is that `OI` is interactive, while they both serve the purpose of visualizing an object, although each `Rep` is concerned with an implementation of displaying only a particular type.

Because the content of the `OI` is loaded async, properties can be in multiple states: unloaded, loading, failed loading, loaded... and `OI` handles this additional async complexity that `Reps` never concern themselves about.

---

concepts:

```
region
wired types
  wired frame
  wired scope
  wired object
  wired eventlistener
  wired appliedrule
  wired containerentry
  wired property
  wired namedvalue
front types
  DOMfront
    nodefront
    RuleFront
    stylefront
    stylesheetfront
  threadfront
  consolefront
  changesfront
  valuefront
  headersfront
  globalfront
logpoint
breakpoint
watchpoint
```

important objects and/or components:

```
- ThreadFront
- ProtocolClient
- domains: Video(Player), AnalysisManager
- DevTools
  - DevToolsToolbox
    - Selection
    - panels:
      - Inspector ("elements")
        - MarkupView
        - RulesView
        - BoxModel
      - DebuggerPanel ("debugger")
        - Editor (in devtools debugger, source-editor.js)
      - React DevTools
- Highlighter (quasi under DevToolsBox as well)
- NodePicker
- JSTerm (jsterm.js) from ConsolePanel (WebConsole)
- ObjectInspector
```

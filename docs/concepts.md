...tl;dr of how things work in general and some basic structure

# `Pause`

A block of data from this pause which might be useful to the protocol client (frontend).

To reduce the number of back-and-forth calls required over the protocol, data which wasn't specifically asked for can be returned by commands or events.

It consists of:

- frames: `Frame[]`
- scopes: `Scope[]`
- objects: `Object[]`

This is a highest-level object from which, and through which, all of the additional details about the recording are derrived. A recording can be viewed as a collection of `Pause`s, where a single `Pause` exists for each JS instruction. (TODO explain this and how it's related to debug stepping and `ExeecutionPoint`s)

(defined in `node_modules/@recordreplay/protocol/js/protocol/Pause.d.ts`, client implementation in `src/protocol/thread/pause.ts`)

# `Frame`

Description of a stack frame.

Types of frame: call, global, module, or eval.

A single `Frame` can have multiple `Scope`s.

(in `node_modules/@recordreplay/protocol/js/protocol/Pause.d.ts`)

# `Scope`

Description of a scope.

Types of scope can be: global, with, function, or block.

A single `Scope` can have multiple `Object`s. A single `Object` can be in multiple `Scopes` at the same time. (TODO check)

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

# `Reps`

`Reps` (representations) are specific components for rendering native JS types or an object (`ValueFront`).

See `../reps/rep.js` for a full list of available types renderings.

# `Grip`

`Grip` is client representation of remote JS object.

...TODO

# Object Inspector

`Object Inspector` (`OI`) is used to display a value of a certain JS object whose entire content is only loaded through user interactions, where the user expands the object progressively and loads further pieces of the content one by one.

It's mostly used in Console and Editor, so that the user can inspect the value of an object:

https://user-images.githubusercontent.com/1355455/156434746-a9656732-0d20-4a83-ba14-62373637d39a.mp4

`OI` doesn't load all of its content immediately, and, instead, it progressively collects more data as you interact with it in the UI.

It works by coalescing several different types within its implementation that each know how to render themselves (see `Item` type in `src/devtools/packages/devtools-reps/object-inspector/utils/index.ts`) and it heavily relies on `Reps` to actually render sub-trees of an object's content. The main difference between `Reps` and `OI` is that `OI` is interactive, while they both serve the purpose of visualizing an object, although each `Rep` is concerned with an implementation of displaying only a particular type.

Because the content of the `OI` is loaded async, properties can be in multiple states: unloaded, loading, failed loading, loaded... and `OI` handles this additional async complexity that `Reps` never concern themselves about.


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

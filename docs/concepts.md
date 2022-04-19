...tl;dr of how things work in general and some basic structure

# `ExecutionPoint`

An [`ExecutionPoint`](https://static.replay.io/protocol/tot/Recording/#type-ExecutionPoint) is a numeric string
that represents a point in time in the recording.
`ExecutionPoint`s for earlier points in time are smaller numbers than the ones for later points in time.
However, it is not possible to compute the time (i.e. the milliseconds elapsed since the beginning of the recording)
from an `ExecutionPoint`, so that information is often transmitted together with an `ExecutionPoint`
in a [`TimeStampedPoint`](https://static.replay.io/protocol/tot/Recording/#type-TimeStampedPoint).
For more information on `ExecutionPoint`s see https://github.com/RecordReplay/backend/blob/master/docs/execution-points.md

# Regions

A region is a time range in the recording, usually described by a
[`TimeStampedPointRange`](https://static.replay.io/protocol/tot/Recording/#type-TimeStampedPointRange).
When the backend loads a recording, it divides it into regions that can be unloaded individually to free up resources.
Regions can be unloaded spontaneously by the backend to alleviate memory pressure, but the frontend can also tell the backend
that it wishes to unload a region or to load it again. When the user uses focus mode to focus on a time range in the recording,
the frontend requests that all regions that do not intersect with the selected time range are unloaded.

# Sources and sourcemapping

When a recording is opened, the frontend loads all javascript sources in that recording using [`Debugger.findSources`](https://static.replay.io/protocol/tot/Debugger/#method-findSources) and stores them in the [`ThreadFront`](../src/protocol/thread/thread.ts). Sourcemaps are handled in the backend, so the sources also include original sources from sourcemaps. Furthermore, the backend automatically adds pretty-printed versions of minified sources. The [`newSource`](https://static.replay.io/protocol/tot/Debugger/#event-newSource) events from the backend include the list of generated sources for every original source. This information is used to pick the sources that are shown to the user: Replay always tries to show an original source and may offer a generated source as an alternate that the user can switch to using the toggle at the bottom of the editor.

This is what a typical source graph for one source file loaded by the browser may look like:

```
          ------
      --> | o1 |
     /    ------
-----
| 1 |
-----
     \    -------
      --> | pp1 |
          -------
```

The arrows in this graph point from generated to original sources. `1` is a source generated from the original source `o1` and since `1` is minified, the backend also created a pretty-printed version `pp1`. Note that Replay declares `pp1` as an _original_ version of `1`, even though technically it was generated from `1` and not the other way around. That way we can assume that an "original" version of a source is always more readable than (and hence preferred over) a "generated" version.
In this example, the Replay frontend would show `o1` by default (the "preferred" version) and allow the user to switch to `pp1` (the "alternate" version).

These source graphs become more complex with bundles which have multiple original sources and minified original sources for which the backend will also create a pretty-printed version. Furthermore, if a source file was loaded multiple times by the browser (usually because the user navigated while recording), it will appear as multiple sources in the recording. The frontend tries to identify duplicates (called corresponding sources) of preferred and alternate sources in `ThreadFront.groupSourceIds()`. All locations received from the backend are updated to reference the first corresponding source of the one they originally referenced.

When the backend sends a source location (e.g. the location of a stack frame), it uses a [`MappedLocation`](https://static.replay.io/protocol/tot/Debugger/#type-MappedLocation) which contains locations in all versions of the source.

# `Pause`

A `Pause` contains information about the debuggee's state at a specific `ExecutionPoint`.

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

TODO why "Frame" exists and how it's used, what sort of info is derived using it

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

# `Wired*` types

In protocol messages for scopes, frames, objects and some others, javascript values are represented by
[`Value`](https://static.replay.io/protocol/tot/Pause/#type-Value).
The `Pause` class replaces all these `Value`s with corresponding `ValueFront`s so that they're easier to work with.
For example, a `Scope` with all `Value`s replaced by `ValueFront`s is a `WiredScope` etc.

<details>
  <summary>all Wired types</summary>
  <ul>
    <li><strong>WiredScope:</strong> todo</li>
    <li><strong>WiredObject:</strong> todo</li>
    <li><strong>WiredEventListener:</strong> todo</li>
    <li><strong>WiredAppliedRule:</strong> todo</li>
    <li><strong>WiredContainerEntry:</strong> todo</li>
    <li><strong>WiredProperty:</strong> todo</li>
    <li><strong>WiredNamedValue:</strong> todo</li>
  </ul>
</details>

# `*Front` types

`Front` types are wrappers that combine raw data coming from the protocol (`Wired` types), their client representation (something that this codebase can easily work with and perhaps render) and interactions with those objects.

Motivation: `Wired` types and `Object` are too abstract and cannot be repsented in the UI nor interacted with, so an additional layer is added to specialize types and add interactions (methods). But some of the interactions cannot be calculated only locally, and actually need to communicate with the backend to retrieve the additional data, so this layer serves that dual purpose of being a bridge between very raw remote values and something that the frontend can make sense of.

<details>
  <summary>all Front types</summary>
  <ul>
    <li><strong>ThreadFront:</strong> the main interface used to interact with the session on the backend</li>
    <li><strong>ValueFront:</strong> some general JS object or type</li>
    <li><strong>DOMFront</strong> (union type)<ul>
      <li><strong>NodeFront:</strong> a DOM Node</li>
      <li><strong>RuleFront:</strong> a single CSS style rule</li>
      <li><strong>StyleFront:</strong> an inline CSS</li>
      <li><strong>StyleSheetFront:</strong> a stylesheet</li>
    </ul></li>
    <li><strong>NodeBoundsFront:</strong> a DOM node's bounding box</li>
    <li><s><strong>ChangesFront</strong></s> (unused)</li>
  </ul>
</details>

(see `protocol/thread/**` for various `Front` implementations)

# `Reps`

`Reps` (representations) are components for rendering a specific native JS types or an object. Their primary input is a `ValueFront` and they render a component based on the type it represents.

(see `../reps/rep.js` for a full list of available components)

# `Grip`

`Grip` is client representation of remote JS object.

...TODO

# `Object Inspector`

`Object Inspector` (`OI`) is used to display a value of a certain JS object whose entire content is only loaded through user interactions, where the user expands the object progressively and loads further pieces of the content one by one.

It's mostly used in Console and Editor, so that the user can inspect the value of an object:

https://user-images.githubusercontent.com/1355455/156434746-a9656732-0d20-4a83-ba14-62373637d39a.mp4

<img width="418" alt="image" src="https://user-images.githubusercontent.com/1355455/156566684-8eba49d5-cb53-4952-9d38-5ae463ca0288.png">

`OI` doesn't load all of its content immediately, and, instead, it progressively collects more data as you interact with it in the UI.

It works by coalescing several different types within its implementation that each know how to render themselves (see `Item` type in `src/devtools/packages/devtools-reps/object-inspector/utils/index.ts`) and it heavily relies on `Reps` to actually render sub-trees of an object's content. The main difference between `Reps` and `OI` is that `OI` is interactive, while they both serve the purpose of visualizing an object, although each `Rep` is concerned with an implementation of displaying only a particular type.

Because the content of the `OI` is loaded async, properties can be in multiple states: unloaded, loading, failed loading, loaded... and `OI` handles this additional async complexity that `Reps` never concern themselves about.

---

# `Editor`

- resources (Source panel)
- outline (scopes)

# `Debugger`

- breakpoints
- logpoints
  - smaller timeline that appears and debugging inside
  - printing / eval
- debugging (stepping)

# `Console`

how it works, eager eval overview, OI, autocomplete...

# `Viewer`

The viewer is the video preview of a recording.

how it fetches image frames and doesn't affect the current pause while playing

# `Inspector`

- Elements
  - Markup
  - Rules
  - Layout
  - Computed
  - Event Listeners

# `NodePicker` and `Highlighter`

With `NodePicker` you can pick a node from the `Viewer`.
`Highlighter` highlights a node in the `Viewer` based on the interaction in the `Inspector`.

It works by...

# Networking

how it gets its data, how it makes interactions within it possible

# React DevTools

how it works, how it makes interactions within it possible

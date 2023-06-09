# Replay DevTools Codebase Concepts and Key Terms

This document includes some incomplete but still very useful info about a number of key concepts used inside the Replay DevTools client and backend codebases, as well as a few of the component areas in the client.

## Regions and Time Ranges

The Replay backend has to load portions of the recording into memory, and allows the client to request that the backend pause the recording at specific points in time.

### Regions

A **region** is a time range in the recording, usually described by a
[`TimeStampedPointRange`](https://static.replay.io/protocol/tot/Recording/#type-TimeStampedPointRange).

When the backend loads a recording, it divides it into regions that can be unloaded individually to free up resources.
Regions can be unloaded spontaneously by the backend to alleviate memory pressure, but the frontend can also tell the backend
that it wishes to unload a region or to load it again. When the user uses focus mode to focus on a time range in the recording,
the frontend requests that all regions that do not intersect with the selected time range are unloaded.

### `ExecutionPoint`

An [`ExecutionPoint`](https://static.replay.io/protocol/tot/Recording/#type-ExecutionPoint) is a numeric string that represents an extremely specific point in time in the recording (roughly one JS interpreter operation).

`ExecutionPoint`s for earlier points in time are smaller numbers than the ones for later points in time. However, it is not possible to compute the time (i.e. the milliseconds elapsed since the beginning of the recording) from an `ExecutionPoint`, so that information is often transmitted together with an `ExecutionPoint` in a [`TimeStampedPoint`](https://static.replay.io/protocol/tot/Recording/#type-TimeStampedPoint).

For more information on `ExecutionPoint`s see https://github.com/RecordReplay/backend/blob/master/docs/execution-points.md

## Pauses and Object Values

When the Replay client requests that the backend pause the recording, the client may then request data values that describe the values that were part of the JS execution at that point in time.

### `Pause`

A `Pause` contains information about the debuggee's state at a specific `ExecutionPoint`.

It consists of:

- frames: `Frame[]`
- scopes: `Scope[]`
- objects: `Object[]`

This is a highest-level object from which, and through which, all of the additional details about the recording are derived.

A recording can be viewed as a collection of different objects (`Frame`s, `Scope`s and `Objects`, `Resources`,...) that have different lifetimes throughout the entire duration of the recording. **A single "pause" reflects object alive at one particular point in time**.

#### Regions vs Pauses

A "region" is an entire interval of time (and not just a single point in time) that represents objects alive during that period of time. So throughout the entire duration of the recording, many different objects come to life and get destroyed, a region is a subset of those for a particular interval of time, and a "pause" an even smaller subset of those.

An entire recording has way too many objects that go in and out of existence and carry too many details for us to be able to hold all of that information in the memory at once. And that's why every recording is split into "regions" - smaller chunks of data that can be transmitted over network and stored in memory on the client, and further data derived from and interacted with. "Regions" are not something that user ever particularly cares about (beside being forced to wait for them to be loaded) and that they interact with, and instead, the user interacts with "pauses". A "pause" is that single moment in time for which the user can inspect the state of the application.

A single `Pause` exists for each JS instruction. (TODO explain this and how it's related to debug stepping and `ExecutionPoint`s)

(defined in `node_modules/@replayio/protocol/js/protocol/Pause.d.ts`, client implementation in `src/protocol/thread/pause.ts`)

### `Frame`

Description of a stack frame.

Types of frame: call, global, module, or eval.

A single `Frame` can have multiple `Scope`s.

A frame is not something that the user interacts with and is used to derive further information that the user can and wants to interacts with.

(in `node_modules/@replayio/protocol/js/protocol/Pause.d.ts`)

TODO why "Frame" exists and how it's used, what sort of info is derived using it

### `Scope`

Description of a scope.

Types of scope can be: global, with, function, or block.

_Global_ and _with_ scopes have an underlaying `Object` associated with them, a _function_ scope has a function associated with it.

Scope is simply a collection of (named) values which are more or less an `Object`. Thus, a scope is a subset of `Object`s, and every `Object` belongs to one `Scope`s. Because JavaScript is lexically scoped, scopes create a tree-like structure in which all objects can be found.

Scope is what the users want to often interact with and inspect, as it can tell them information such as "what's the value of a particular variable while some function was executing" and "if a variable was shadowed by some other".

(in `node_modules/@replayio/protocol/js/protocol/Pause.d.ts`)

### `Object` and `ObjectPreview`

`Object` is a description of any JS object or a type.

`ObjectPreview` is an actual description of some or all `Object`'s contents.

(in `node_modules/@replayio/protocol/js/protocol/Pause.d.ts`)

### `Wired*` types

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

### `*Front` types

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

## Sources and sourcemapping

> **Note**: this part of the document has seen some change recently, and there is likely more change coming. While this is a good primer on how we use sources in Replay, if this is your first time reading about these topics you'll probably come away with more questions than answers. That's okay! Read these docs, write down the parts that don't make sense, and use those as a jumping off point to start asking good questions!

### Sources Overview

Replay captures the names, paths, and contents of every source file that was included in the recorded application. When a recording is loaded, the backend extracts the list of source files and sends the names and basic details to the client. The client can then ask for more information on those files, such as text contents, hit counts for lines, where breakpoints _could_ be added, and more.

However, there can be many different versions of a single source file. The different file versions available depend on the way the application was compiled, whether sourcemaps were included, and other additional factors.

The Replay client needs to know how these different versions of the same file relate to each other in order to determine things like:

- which version to show when a filename is clicked in the sources tree
- how to ask the backend for line hit information by source ID
- How to toggle between "sourcemapped" and "non-sourcemapped" versions of a file

### Sources Key Concepts

Sources and sourcemaps get confusing because we use similar words to mean slightly different things sometimes. There are two different concepts to keep in mind when thinking about how different sources are related to one another.

#### "Original" and "Generated" Sources

The first concept is _"original"_ vs _"generated"_. Another way to think about this is input vs. output. For any given transformation to a file (whether that is minifying, transpiling, pretty-printing, whatever) there is an input file (called the **original source**) and an output file (called a **generated source**).

The place that input and output break down is when thinking about a transformation in which there are multiple steps. In that case, the input to the _first_ transformation is the original, and all later sources are generated, even if they serve as inputs themselves.

However, in the Replay Protocol (and hence also the code), "original" vs "generated" is used differently: when a source is the result of a transformation of another source, this connection between the two sources is reported in the protocol, but sometimes Replay calls the input of the transformation the generated source and the output the original source (while from the definition above it would be the other way around).

In Replay, the source that is more likely to be preferred by the user is called the original and the other the generated source:

- a transpiled source containing a sourcemap is a generated source, the source referenced by the sourcemap (the input of the transpilation) is an original source
- a pretty-printed source is an original source, the minified source is a generated source
- an html page containing an inline script is an original source, the extracted script is a generated source

#### "Preferred", "Alternate", and "Canonical" sources

Then there is the concept of preferred vs. alternate.

A preferred source is not defined quite as formally, but it should be a source that is more comfortable for a human to read, while an alternate source should be closer to what the browser ran (but might be hard for a human to understand).

Some of the confusion around what sources fall into what categories comes from conflating these two concepts. For instance, you might think "I should always prefer original sources". A lot of the time that will be correct! However, in the case of an operation like pretty-printing, the input source (the minified file) is harder to read than the ouput (pretty-printed) source.

We get these concepts confused sometimes even in the protocol. For instance, we return the pretty-printed version of a minified file as the original, even though it's actually the generated file (the output from our pretty-printing transformation).

Because of that, we've recently introduced the term "canonical source" to mean the source that is the most relevant for the user and likely that all other versions were derived from.

### Sources Terms

With all that in mind, here's a vocab list to help grok these explanations:

- **_Transformation_**: any automated change to a file that gets fed some input and produces some output. Generally speaking, in order for any of this to work, the transformation has to preserve the behavior of the program described by the file, but otherwise, the transformation can do whatever it wants.
- **_Original source_**: The input to the first transformation in the toolchain. Important note: it is possible for a source to be the output of one transformation and the input to another! In that case, even though you could argue that there are multiple original sources, **it is easiest to think of the original source as whatever the developer typed into their editor**. If a given version of the file is _not_ what was in the developer's editor, then it is a generated source.
- **_Generated source_**: The output of running an original source through a toolchain (might be minified, transpiled, bundled, or otherwise transformed). This includes things that have been run through a single part of a multi-part toolchain (for example, transpiled but not yet bundled).
- **_Alternate sources_**: this one is slightly tricky to express concisely, and it can mean a couple of different things depending on context. One specific meaning is a group of sources which map onto each other. This can be a huge group if that file was ever included in a bundle, because now _all_ files that were bundled together are all alternates for the bundle, and they are indirectly alternates for _each other_. Another use for the term is distinguishing a preferred source from an alternate source.
- **_Canonical source_**: When we use the terms "preferred" and "alternate" as defining categories, it's easiest to think of this in terms of _"canonicalization"_ (or normalization). By definition, all alternate sources are valid representations of that source, but only one of them is considered the canonical form. We call that source the preferred source and the others alternate sources. This is slightly different from the definition above, where it would be valid to say that the preferred source is a single member of a group of alternate sources, that gets selected as the preferred source by some criteria.
- **_Corresponding sources_**: a file which was loaded multiple times during a single recording, from the same URL, with the same content. For example, because the user refreshed the page. It's important to note that the sources are only corresponding if they share the URL _and their content is exactly the same_. In the case of HMR or a dev server refreshing to load changes, the two files (which might have the same URL) are _not_ corresponding sources.
- **_Pretty-printed sources_**: since many files in an app are minified, the Replay backend will run those sources through a formatter to create a slightly more readable version. The "pretty-printed" versions still have all the minified variable names, but may at least be a bit more readable if there's no source-mapped version available.

#### Terminology Examples

A typical web application might start with `src/index.ts` as its entry point. This is the **original source** - the file as it existed on disk on the app developer's computer.

During the build process, that TS file gets transformed by running it through a TS compilation step, which strips out the TS types. This is a **generated source** - a similar but changed version of the original file.

Later, `src/index.js` and `src/App.js` get bundled together into `main.$HASH.js` for deployment. In this case, **`index.js` and `App.js` are alternate sources of each other**.

If the developer edits a file like `App.tsx` while making the recording, and a hot-reloaded file happens to be identical to a previous file that was seen (such as an earlier version of that file), those identical files are **corresponding sources**.

The main app bundle or some other minified file will be run through a formatter to produce yet another version of the file that is more readable. That auto-formatted version is a **pretty-printed** source.

### Sources Examples

Here are some sources from examples for our e2e tests (URLs starting with https://app.replay.io/test/examples have been shortened). The arrows in the graphs point from generated to original sources.

#### doc_prod_bundle.html

```
|id   | kind          | url                        |
|--------------------------------------------------|
|2    | scriptSource  | .../prod_bundle.js         |
|pp2  | prettyPrinted | .../prod_bundle.js         |
|o1   | sourceMapped  | webpack:///bundle_input.js |
```

```
          ------
      --> | o1 |
     /    ------
-----
| 2 |
-----
     \    -------
      --> | pp2 |
          -------
```

`2` is a source generated from the original source `o1` and since `2` is minified, the backend also created a pretty-printed version `pp2`.
In this example, the Replay frontend would show `o1` by default (the "preferred" version) and allow the user to switch to `pp1` (the "alternate" version).

#### doc_minified.html

```
|id   | kind          | url
|--------------------------------------------------
|h1   | html          | .../doc_minified.html      |
|pph1 | prettyPrinted | .../doc_minified.html      |
|3    | inlineScript  | .../doc_minified.html      |
|2    | scriptSource  | .../minified.js            |
|pp2  | prettyPrinted | .../minified.js            |
|4    | scriptSource  | .../mapped_minified.js     |
|o1   | sourceMapped  | webpack:///bundle_input.js |
|ppo1 | prettyPrinted | webpack:///bundle_input.js |
```

```
-----    ------    --------
| 3 | -> | h1 | -> | pph1 |
-----    ------    --------

-----    -------
| 2 | -> | pp2 |
-----    -------

-----    ------    --------
| 4 | -> | o1 | -> | ppo1 |
-----    ------    --------
```

`h1` is an html page containing the inline script `3`. The html page itself is pretty-printed to produce `pph1`.
`2` is a minified script and `pp2` its pretty-printed version.
`4` is a bundle with a sourcemap containing the script `o1`, which is pretty-printed to produce `ppo1`.

These source graphs become more complex with bundles which have multiple original sources and minified original sources for which the backend will also create a pretty-printed version.

### Sources Processing

#### Initial Loading

When a recording is opened, the frontend loads all javascript sources in that recording using [`Debugger.findSources`](https://static.replay.io/protocol/tot/Debugger/#method-findSources) and stores them in the [`ThreadFront`](../src/protocol/thread/thread.ts). Sourcemaps are handled in the backend, so the sources also include original sources from sourcemaps. Furthermore, the backend automatically adds pretty-printed versions of minified sources and extracted inline scripts from html pages.

The [`SourceKind`](https://static.replay.io/protocol/tot/Debugger/#type-SourceKind) specifies where a source came from.

The [`newSources`](https://static.replay.io/protocol/tot/Debugger/#event-newSources) events from the backend include the list of generated sources for every original source. This information is used to pick the sources that are shown to the user: Replay always tries to show an original source and may offer a generated source as an alternate that the user can switch to using the toggle at the bottom of the editor.

#### Managing Corresponding / Duplicate Sources

A recording may contain multiple sources with the same URL, this happens when the user navigated while recording or when a dev-server uses hot module replacement. If the sources have identical content we want to present these as one source to the user. To this end, the frontend identifies duplicates (called corresponding sources) of preferred and alternate sources in `ThreadFront.groupSourceIds()` by looking at their `url` and `contentHash` (it also ensures that only sources that are not original/generated versions of each other and that are both picked as a preferred or alternate source for their URL are identified as duplicates - this is probably overly cautious and the algorithm could be significantly simplified if we drop these requirements). All locations received from the backend are updated to reference the first corresponding source of the one they originally referenced. Whenever we send locations to the backend (e.g. to set a breakpoint or when running an analysis) we need to do the opposite and add locations for all corresponding sources.

#### Mapping Locations Across Source Versions

When the backend sends a source location (e.g. the location of a stack frame), it uses a [`MappedLocation`](https://static.replay.io/protocol/tot/Debugger/#type-MappedLocation) which contains locations in all versions of the source - one of them is the source that the browser executed and the others are original versions (from sourcemaps, pretty-printing and the extraction of inlined scripts from an html page) of it.

#### Selecting a Preferred Source Version

The selection of preferred and alternate sources is implemented in `ThreadFront._chooseSourceId()`. It takes an array of sourceIds that usually come from a `MappedLocation`, removes those of minified sources (i.e. those for which a pretty-printed version exists) and inline scripts (if the corresponding html page is among the sources) and categorizes each source as "original" if it is from a sourcemap or a pretty-printed version of a source from a sourcemap and "generated" otherwise. It assumes that there is at most one "generated" source according to this categorization. If there is at least one "original" source, it picks that as the preferred source and the "generated" source (if any) as the alternate. Otherwise there should be exactly one source which is "generated" and that is the preferred source.

## DevTools Client Components

The DevTools application and UI can be split into several different major areas and key components.

### `Object Inspector`

`Object Inspector` (`OI`) is used to display a value of a certain JS object whose entire content is only loaded through user interactions, where the user expands the object progressively and loads further pieces of the content one by one.

It's mostly used in Console and Editor, so that the user can inspect the value of an object:

https://user-images.githubusercontent.com/1355455/156434746-a9656732-0d20-4a83-ba14-62373637d39a.mp4

<img width="418" alt="image" src="https://user-images.githubusercontent.com/1355455/156566684-8eba49d5-cb53-4952-9d38-5ae463ca0288.png">

`OI` doesn't load all of its content immediately, and, instead, it progressively collects more data as you interact with it in the UI.

It works by coalescing several different types within its implementation that each know how to render themselves (see `Item` type in `src/devtools/packages/devtools-reps/object-inspector/utils/index.ts`) and it heavily relies on `Reps` to actually render sub-trees of an object's content. The main difference between `Reps` and `OI` is that `OI` is interactive, while they both serve the purpose of visualizing an object, although each `Rep` is concerned with an implementation of displaying only a particular type.

Because the content of the `OI` is loaded async, properties can be in multiple states: unloaded, loading, failed loading, loaded... and `OI` handles this additional async complexity that `Reps` never concern themselves about.

#### `Reps`

`Reps` (representations) are components for rendering a specific native JS types or an object. Their primary input is a `ValueFront` and they render a component based on the type it represents.

(see `../reps/rep.js` for a full list of available components)

#### `Grip`

`Grip` is client representation of remote JS object.

...TODO

### `Editor`

- resources (Source panel)
- outline (scopes)

### `Debugger`

- breakpoints
- logpoints
  - smaller timeline that appears and debugging inside
  - printing / eval
- debugging (stepping)

### `Console`

how it works, eager eval overview, OI, autocomplete...

### `Viewer`

The viewer is the video preview of a recording.

how it fetches image frames and doesn't affect the current pause while playing

### `Inspector`

- Elements
  - Markup
  - Rules
  - Layout
  - Computed
  - Event Listeners

### `NodePicker` and `Highlighter`

With `NodePicker` you can pick a node from the `Viewer`.
`Highlighter` highlights a node in the `Viewer` based on the interaction in the `Inspector`.

It works by...

### Networking

how it gets its data, how it makes interactions within it possible

### React DevTools

how it works, how it makes interactions within it possible

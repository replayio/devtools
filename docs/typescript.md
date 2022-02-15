# Using Typescript in the Replay DevTools

We've started using Typescript in DevTools, but a large part of the code is still written in Javascript and the DevTools code will remain a mixture of Javascript and Typescript for the foreseeable future.
This document is a collection of tips for working with TypeScript in DevTools. If you had a hard time figuring something out related to Typescript, please consider adding it to this document.

## Changing a module from Javascript to Typescript

### Changing the file's extension

The first step is to change the file's extension from `.js` to `.ts` or `.tsx`. Our current webpack setup allows the use of JSX tags in any `.js` file, but not in a `.ts` file, so you'll have to use `.tsx` if the file contains JSX.
Don't forget to restart webpack any time you rename a source file.

### Fixing the imports

In Javascript modules you can use `import` and `require` (almost) interchangeably, but in Typescript there is an important distinction: anything that you `require` will have type `any`, only `import` will use the imported module's types.
So you should change any `require` to `import` if the imported module has types (i.e. it is a Typescript file or there is a `.d.ts` file for it).
Conversely if you `import` from any module without types, Typescript will complain. In that case you either have to provide types for that file (see below) or change the `import` to `require`.
In the latter case beware that default exports are handled by `import` but not by `require`, so if `example.js` contains a default export, you'd have to change `import Example from "./example";` to `const Example = require("./example").default;`.

#### Adding types for a module without converting it to Typescript

You can add type definitions for the exports of a module without converting it to Typescript (and hence without having to add type definitions for all of its code) by adding a file with the same name but extension `.d.ts` next to it.
The syntax for `.d.ts` files looks very similar to Typescript but is slightly different and sometimes it can be hard to figure out the right syntax.
In that case you can write a Typescript file, compile it and look at the generated `.d.ts` file to figure it out. The easiest way to do this is by using the Typescript Playground:
open [this link](https://www.typescriptlang.org/play?target=1&module=1), write your Typescript code on the left-hand side and have a look at the `.d.ts` file on the right-hand side.

#### Adding types for npm packages

While more and more npm packages ship with type definitions, there are many that still don't. For many of these there are community-contributed type definitions on npm in the `@types` scope.
So if you want types for the npm package `some-lib`, check if there is a package `@types/some-lib` and install that as a dev dependency.
You can also search for the package on the [Type Search](https://www.typescriptlang.org/dt/search) website.

### Dealing with nullable values

After converting a file to Typescript you will often see many errors about values that may be `null` or `undefined`. How to fix them should be decided on a case-by-case basis:

- by checking the value: Typescript usually understands that a value can't be nullable after you have checked it. For example, if you write `if (value) { ... }`, `value` will not be considered nullable in the `if` expression's body.
- sometimes when you do check a value, Typescript can't infer that it isn't nullable: if you write `if (obj.getValue()) { ... }`,
  Typescript will still assume that `obj.getValue()` can be `null` or `undefined` in the `if` expression's body.
  This is correct because Typescript can't know that `obj.getValue()` will always return the same value. In this case you could assign `obj.getValue()` to a new variable and work with that.
- by using the optional chaining operator (`?.`) or the nullish coalescing operator (`??`).
- if you're sure that the value isn't really nullable, you can tell this to Typescript:
  - by using `assert(value);` (with `assert` imported from `protocol/utils`): Typescript knows that the value can't be `null` or `undefined` in the code following the assert. Also, the assert will check your assumption at runtime.
  - by using `value!` - this should only be used when it is obvious from the immediately surrounding code that the value can't be nullable.
    A typical example is accessing the values of a Map: `if (map.has(key)) { ... map.get(key)! ... }` - Typescript doesn't know about the connection between `map.has(key)` and `map.get(key)` and so it assumes that `map.get(key)` could return `undefined`.

## Typescript with React/Redux

Redux has good introductions for using Typescript with [`redux`](https://redux.js.org/recipes/usage-with-typescript/) and with [`react-redux`](https://react-redux.js.org/using-react-redux/static-typing).
They're short yet informative, so I highly recommend reading them.

The module `ui/actions` contains some central type definitions: `UIStore` is the type of our redux store, `UIState` the type of its state and `UIThunkAction` is the type for redux thunks.
`UIThunkAction` is particularly useful because when you use it you don't need to specify the argument types of the inner function in a thunk.

## Miscellany

### Typing return values

In general it is not necessary to specify the return type of a function because Typescript will try to infer it. But sometimes it is useful to specify it anyway:

- when you want to check that the return value is correct: for example I recommend specifying the return type of all reducer functions.
- when the type inferred by Typescript is not as precise as it could be: for example if a function returns either the string `"x"` or `"y"`, Typescript will infer the return type to be `string`, but you may want to narrow it to `"x" | "y"`.

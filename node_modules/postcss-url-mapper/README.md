# [postcss][postcss]-url-mapper [![Build Status][ci-img]][ci] [![npm version][npm-img]][npm]
> Simple .map for urls in CSS

<img align="right" width="95" height="95"
     title="Philosopher’s stone, logo of PostCSS"
     src="http://postcss.github.io/postcss/logo.svg">

## Install

With [npm][npm] do:

```
npm install postcss-url-mapper --save
```

## Usage

```js
postcss([require('postcss-url-mapper')(mapfunc, options)])
```

See the [PostCSS documentation](https://github.com/postcss/postcss#usage) for examples for your environment.

## Configuration

### Map
Map function.  
Takes two arguments: `url` and `type`, where `type` is a name of CSS variable, property or at-rule (`background`, `cursor`, `import`, `--color`, etc).  
*Required.*

### Options

#### atRules
Indicates whether the mapper should call map function for at-rules (like `@import`).  
Type: `boolean`  
Default: `false`

## Example
Let's imagine that we need to add prefix `/fonts/` for all `src` urls, `/bg/` for value of CSS variable `--background-image` and `/images/` for urls in other properties. And we also need to replace `http` with `https` in `@import`:

```js
postcss([require('postcss-url-mapper')(urlMapper, { atRules: true })]);

function urlMapper(url, type) {
  switch (type) {
    case 'import':
      return url.replace('/^http/', 'https');
    case 'src':
      return `/fonts/${url}`;
    case '--background-image':
      return `/bg/${url}`;
    default:
      return `/images/${url}`;
  }
}
```

**Note:** Mapper doesn't match on data URI (`url` is always URL), but you can return it, e.g. when you replace icons with their data. But I think there is better tools for such tasks.

[postcss]: https://github.com/postcss/postcss
[npm]: https://www.npmjs.com/package/postcss-url-mapper
[ci-img]: https://travis-ci.org/igoradamenko/postcss-url-mapper.svg?branch=master
[ci]: https://travis-ci.org/igoradamenko/postcss-url-mapper
[npm-img]: https://img.shields.io/npm/v/postcss-url-mapper.svg

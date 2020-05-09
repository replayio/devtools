## [5.0.1](https://github.com/peerigon/extract-loader/compare/v5.0.0...v5.0.1) (2020-03-06)


### Bug Fixes

* Add missing Babel dependency ([#76](https://github.com/peerigon/extract-loader/issues/76)) ([72ff48d](https://github.com/peerigon/extract-loader/commit/72ff48d))

# [5.0.0](https://github.com/peerigon/extract-loader/compare/v4.0.3...v5.0.0) (2020-03-05)


### Features

* Add support for ECMAScript modules ([#69](https://github.com/peerigon/extract-loader/issues/69)) ([6034f23](https://github.com/peerigon/extract-loader/commit/6034f23))


### BREAKING CHANGES

* The extract-loader now uses Babel to transpile the bundle code for the current Node version. This is required in order to support the new file-loader which produces ECMAScript modules. This *should not* be a breaking change but since Babel is also known to be kind of brittle in regards of configuration we cannot guarantee that there might be unknown/unwanted side-effects in your project setup.

## [4.0.3](https://github.com/peerigon/extract-loader/compare/v4.0.2...v4.0.3) (2020-01-29)


### Bug Fixes

* explicit build before release since prePublishOnly does not run ([83299e9](https://github.com/peerigon/extract-loader/commit/83299e9))

## [4.0.2](https://github.com/peerigon/extract-loader/compare/v4.0.1...v4.0.2) (2020-01-29)


### Bug Fixes

* adjust release action to fix build step ([9216425](https://github.com/peerigon/extract-loader/commit/9216425))

## [4.0.1](https://github.com/peerigon/extract-loader/compare/v4.0.0...v4.0.1) (2020-01-28)


### Bug Fixes

* handling resource paths with query parameters ([b4b2c0a](https://github.com/peerigon/extract-loader/commit/b4b2c0a))

# [4.0.0](https://github.com/peerigon/extract-loader/compare/v3.1.0...v4.0.0) (2020-01-27)


### chore

* remove node v6 support ([3938c75](https://github.com/peerigon/extract-loader/commit/3938c75))


### BREAKING CHANGES

* remove node v6 support

# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="3.1.0"></a>
# [3.1.0](https://github.com/peerigon/extract-loader/compare/v3.0.0...v3.1.0) (2018-11-26)


### Features

* Accept function as publicPath option ([#51](https://github.com/peerigon/extract-loader/issues/51)) ([678933e](https://github.com/peerigon/extract-loader/commit/678933e))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/peerigon/extract-loader/compare/v2.0.1...v3.0.0) (2018-08-31)


### Features

* Add source map support ([#43](https://github.com/peerigon/extract-loader/issues/43)) ([8f56c2f](https://github.com/peerigon/extract-loader/commit/8f56c2f)), closes [#1](https://github.com/peerigon/extract-loader/issues/1)
* Enable deep evaluation of dependency graph ([#42](https://github.com/peerigon/extract-loader/issues/42)) ([c5aff66](https://github.com/peerigon/extract-loader/commit/c5aff66))


### BREAKING CHANGES

* Although the change is not breaking according to our tests, we assume that there could be problems in certain projects.



<a name="2.0.1"></a>
## [2.0.1](https://github.com/peerigon/extract-loader/compare/v2.0.0...v2.0.1) (2018-03-20)

Re-Release, because v2.0.0 was missing the `lib/extractLoader.js` file [#37](https://github.com/peerigon/extract-loader/issues/37)

### Bug Fixes
*   Update package.json `engines` field to properly state Node.js 6+ support

<a name="2.0.0"></a>

# [2.0.0](https://github.com/peerigon/extract-loader/compare/v1.0.2...v2.0.0) (2018-03-19)

### Features

*   Add support for webpack 4 ([77f1a670eea87a7adea05cf66a4d54b2995be0e6](https://github.com/peerigon/extract-loader/commit/77f1a670eea87a7adea05cf66a4d54b2995be0e6))

### Bug Fixes

*   TypeError require(...) is not a function ([050f189](https://github.com/peerigon/extract-loader/commit/050f189))

### BREAKING CHANGES

*   extract-loader does now officially only support node >= 6. No guarantee for older node versions.

<a name="1.0.2"></a>

## [1.0.2](https://github.com/peerigon/extract-loader/compare/v1.0.1...v1.0.2) (2018-01-11)

<a name="1.0.1"></a>

## [1.0.1](https://github.com/peerigon/extract-loader/compare/v1.0.0...v1.0.1) (2017-08-19)

### Bug Fixes

*   Fix problems with aliased paths ([f5a1946a7b54ef962e5af56aaf29d318efaabf66](https://github.com/peerigon/extract-loader/commit/f5a1946a7b54ef962e5af56aaf29d318efaabf66))

<a name="1.0.0"></a>

# [1.0.0](https://github.com/peerigon/extract-loader/compare/v0.1.0...v1.0.0) (2017-05-24)

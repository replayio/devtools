[//]: # (
  This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
)

# Upgrading prop-types

## Getting the Source

```bash
git clone git@github.com:facebook/prop-types.git
cd prop-types
```

## Building

```bash
npm install
NODE_ENV=development browserify index.js -t envify --standalone PropTypes -o prop-types-dev.js
NODE_ENV=production browserify index.js -t envify --standalone PropTypes -o prop-types.js
```

## Copying files to your Firefox repo

```bash
mv prop-types.js /firefox/repo/prop-types.js
mv prop-types-dev.js /firefox/repo/prop-types-dev.js
```

## Adding Version Info

Add the version to the top of `prop-types.js` and `prop-types-dev.js`.

```js
 /**
  * prop-types v15.6.0
  */
```

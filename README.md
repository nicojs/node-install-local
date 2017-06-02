[![Build Status](https://travis-ci.org/nicojs/node-install-local.svg?branch=master)](https://travis-ci.org/nicojs/node-install-local)

# Install local

Installs npm/yarn packages locally without symlink. Exactly the same as your production installation, no compromises. Won't mess up your package.json.

## Getting started

You can use install-local from command line or programmatically.

Command line:

```bash
$ install-local my-package my-dependant-package [my-dependant-package2, ...]
```

From node:

```javascript
const { installLocal } = require('install-local');
installLocal('my-package', 'my-dependant-package'/*, my-dependant-package2, ...*/)
    .then(() => console.log('done'))
    .catch(err => console.error(err));
```

_TypeScript types are also included_

## Why?

Why installing packages locally? There are a number of use cases.

1. You want to test if the installation of your package results in expected behavior (test your .npmignore file, etc)
1. You want to install a package locally in a [lernajs-style](http://lernajs.io/) [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)
1. You just want to test a fork of a dependency, after building it locally.

## What's wrong with [npm-link](https://docs.npmjs.com/cli/link)?

Well... nothing is _wrong_ with npm link. It's just not covering all use cases. 

For example, if your using typescript and you `npm link` a dependency from a _parent_ directory, you might end up with infinite ts source files, resulting in an out-of-memory error:

```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

An other reason is with `npm link` your **not** testing if your package actually installs correctly. You might have files in there that will not be there after installation.

## Can't i use `npm install file:../my-dependency-package`

You could use `npm install file:..` versions of npm < version 5.

## How to guarantee a production-like install

To guarantee the production-like installation of your dependency, `install-local` uses [`npm pack`](https://docs.npmjs.com/cli/pack) and [`npm install <tarball file>](https://docs.npmjs.com/cli/install) under the hood. This is as close as production-like as it gets.
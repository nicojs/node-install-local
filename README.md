[![Build Status](https://travis-ci.org/nicojs/node-install-local.svg?branch=master)](https://travis-ci.org/nicojs/node-install-local)

# Install local

Installs npm/yarn packages locally without symlink, also in npm 5. Exactly the same as your production installation, no compromises.

## Getting started

Install with

```bash
npm install -g install-local
```

You can use install-local from command line or programmatically.

## Command line:

```bash
Usage: 
$ install-local                                       # 1
$ install-local [options] <directory>[ <directory>]   # 2
$ install-local --target-siblings                     # 3
```

Installs a package from the filesystem into the current directory.

Options:


* `-h, --help`: Output this help
* `-S, --save`: Saved packages will appear in your package.json under "localDependencies"
* `-T, --target-siblings`: Instead of installing into this package, this package gets installed into sibling packages
which depend on this package by putting it in the "localDependencies".
Useful in a [lerna](https://github.com/lerna/lerna) style monorepo.

Examples:
* `install-local`
Install the "localDependencies" of your current package
* `install-local ..`
Install the package located in the parent folder into the current directory.
* `install-local --save ../sibling ../sibling2`
Install the packages in 2 sibling directories into the current directory.
* `install-local --help`
Print this help

See [Programmatically](#programmatically) to see how use `install-local` from node.

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

## Can't i use `npm i file:`?

You could use `npm install file:..` versions of npm prior to version 5. It installed the package locally. Since version 5, the functionality changed to `npm link` instead. More info here: https://github.com/npm/npm/pull/15900

## How to guarantee a production-like install

To guarantee the production-like installation of your dependency, `install-local` uses [`npm pack`](https://docs.npmjs.com/cli/pack) and [`npm install <tarball file>`](https://docs.npmjs.com/cli/install) under the hood. This is as close as production-like as it gets.

## Programmatically

_Typings are included for all your TypeScript programmers out there_

```javascript
const { cli, execute, Options, progress, LocalInstaller} = require('install-local');
```

### Use the CLI programmatically

Execute the cli functions with the `cli` function. It returns a promise:

```javascript
cli(['node', 'install-local', '--save', '../sibling-dependency', '../sibling-dependency2'])
    .then(() => console.log('done'))
    .catch(err => console.error('err'));
```

Or a slightly cleaner api:

```javascript
execute({ 
    validate: () => true, 
    dependencies: ['../sibling-dependency', '../sibling-dependency2'], 
    save: true, 
    targetSiblings: false 
})
```

### Install dependencies locally

Use the `LocalInstaller` to install local dependencies into multiple directories.

For example:

```javascript
const localInstaller = new LocalInstaller({
   /*1*/ '.': ['../sibling1', '../sibling2'],
   /*2*/ '../dependant': ['.']
});
progress(localInstaller);
localInstaller.install()
    .then(() => console.log('done'))
    .catch(err => console.error(err));
```

1. This will install packages located in the directories "sibling1" and "sibling2" next to the current working directory into the package located in the current working directory (`'.'`) 
2. This will install the package located in the current working directory (`'.'`) into the package located in 
the "dependant" directory located next to the current working directory.

Construct the `LocalInstall` by using an object. The properties of this object are the relative package locations to install into. The array values are the packages to be installed. Use the `install()` method to install, returns a promise.

If you want the progress reporting like the CLI has: use `progress(localInstaller)`; 

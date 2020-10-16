## [3.0.1](https://github.com/nicojs/node-install-local/compare/v3.0.0...v3.0.1) (2020-10-16)


### Bug Fixes

* **lodash:** remove missing dependency lodash ([b960029](https://github.com/nicojs/node-install-local/commit/b9600290c8b396d48b66a1feb5bc6ea397fffbbb))



# [3.0.0](https://github.com/nicojs/node-install-local/compare/v1.0.0...v3.0.0) (2020-10-16)


### Features

* **deps:** dependency update ([#25](https://github.com/nicojs/node-install-local/issues/25)) ([8e46851](https://github.com/nicojs/node-install-local/commit/8e46851a34be1c3654a40624f06444c9d542f871))
* **install:** ignore other dependencies ([#30](https://github.com/nicojs/node-install-local/issues/30)) ([b9faaae](https://github.com/nicojs/node-install-local/commit/b9faaae3cce413aea350bb383784e10e52afd761))
* **node:** drop support for node 8 ([07fa721](https://github.com/nicojs/node-install-local/commit/07fa72184fc3780263950997bcfa9631e48c0a6f))
* **package:** package source files for debugging ([302f703](https://github.com/nicojs/node-install-local/commit/302f7031177191249e3fb737325989254bee1ac2))


### BREAKING CHANGES

* **install:** `dependencies` and `devDependencies` will **no longer be installed**. If you want the old behavior, be sure to run `npm install` before you run `install-local`.
* **node:** Node 8 is no longer actively supported
* **package:** Files are now published under `dist` directory. Deep imports (which is a bad practice at best) should be updated accordingly.
* **deps:** Output is now es2017. Drop support for node < 8.


# [1.0.0](https://github.com/nicojs/node-install-local/compare/v0.6.2...v1.0.0) (2019-02-12)



## [0.6.2](https://github.com/nicojs/node-install-local/compare/v0.6.0...v0.6.2) (2018-11-21)


### Bug Fixes

* **Space in file name:** Support dirs with a space in the name ([2ea3786](https://github.com/nicojs/node-install-local/commit/2ea3786))



<a name="0.6.0"></a>
# [0.6.0](https://github.com/nicojs/node-install-local/compare/v0.5.0...v0.6.0) (2018-07-12)


### Features

* **install-local:** Support parallel install ([#11](https://github.com/nicojs/node-install-local/issues/11)) ([a2f9524](https://github.com/nicojs/node-install-local/commit/a2f9524))

### Bug fixes

* **Child process:** increase `maxBuffer` to 10MB


<a name="0.5.0"></a>
# [0.5.0](https://github.com/nicojs/node-install-local/compare/v0.4.1...v0.5.0) (2018-03-21)


### Features

* **npmEnv:** add `npmEnv` option to programmatic API ([#7](https://github.com/nicojs/node-install-local/issues/7)) ([c32776a](https://github.com/nicojs/node-install-local/commit/c32776a))



<a name="0.4.1"></a>
## [0.4.1](https://github.com/nicojs/node-install-local/compare/v0.4.0...v0.4.1) (2017-12-21)



<a name="0.4.0"></a>
# [0.4.0](https://github.com/nicojs/node-install-local/compare/v0.3.1...v0.4.0) (2017-06-22)


### Bug Fixes

* **scoped-packages:** Add support for scoped packages ([7c132d0](https://github.com/nicojs/node-install-local/commit/7c132d0)), closes [#1](https://github.com/nicojs/node-install-local/issues/1)


### Features

* **reporting:** Report stdout of install ([55bcc9e](https://github.com/nicojs/node-install-local/commit/55bcc9e))
* **target-siblings:** Target sibling packages ([fc31a7c](https://github.com/nicojs/node-install-local/commit/fc31a7c))


### BREAKING CHANGES

* **target-siblings:** The programmatic interface has changed slightly



<a name="0.3.1"></a>
## [0.3.1](https://github.com/nicojs/node-install-local/compare/v0.3.0...v0.3.1) (2017-06-13)


### Bug Fixes

* **typings:** Add "typings" to package.json to enable typescript support ([ac11871](https://github.com/nicojs/node-install-local/commit/ac11871))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/nicojs/node-install-local/compare/v0.2.0...v0.3.0) (2017-06-13)


### Features

* **local-install:** Make use of "localDependencies" section in package.json ([86563f8](https://github.com/nicojs/node-install-local/commit/86563f8))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/nicojs/node-install-local/compare/v0.1.0...v0.2.0) (2017-06-07)


### Features

* **allow-multiple-targets:** Allow multiple target packages ([a5b2098](https://github.com/nicojs/node-install-local/commit/a5b2098))
* **console:** Add console output when using the cli ([6231b67](https://github.com/nicojs/node-install-local/commit/6231b67))



<a name="0.1.0"></a>
# [0.1.0](https://github.com/nicojs/node-install-local/compare/f4ab2a0...v0.1.0) (2017-06-02)


### Bug Fixes

* Add rimraf as dev dependency ([f4ab2a0](https://github.com/nicojs/node-install-local/commit/f4ab2a0))




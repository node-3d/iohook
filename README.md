# Node.js IO hook

This is a part of [Node3D](https://github.com/node-3d) project.

[![NPM](https://badge.fury.io/js/@node-3d%2Fiohook.svg)](https://badge.fury.io/js/@node-3d%2Fiohook)
[![Lint](https://github.com/node-3d/iohook/actions/workflows/lint.yml/badge.svg)](https://github.com/node-3d/iohook/actions/workflows/lint.yml)
[![Test](https://github.com/node-3d/iohook/actions/workflows/test.yml/badge.svg)](https://github.com/node-3d/iohook/actions/workflows/test.yml)
[![Cpplint](https://github.com/node-3d/iohook/actions/workflows/cpplint.yml/badge.svg)](https://github.com/node-3d/iohook/actions/workflows/cpplint.yml)

```bash
npm install @node-3d/iohook
```



**Node.js** addon providing a hook to track global input and shortcuts.
This work is derived from [wilix-team/iohook](https://github.com/wilix-team/iohook).

```ts
import { iohook } from '@node-3d/iohook';

iohook.on('keydown', (event) => {
	console.log(event.keycode);
});

iohook.shortcut([29, 65], (keys) => {
	console.log('Shortcut pressed with keys:', keys);
});

if (!iohook.init()) {
	throw new Error('Global input permission is unavailable');
}

iohook.start();
```

Importing the package does not start global input capture. Call `init()` first;
it returns `false` when the current process cannot capture input (including when
macOS Accessibility or Input Monitoring permission is unavailable). `start()`
throws if initialization was skipped or the operating system denies access.
`stop()` is safe to call when the hook is not running.

> Note: this **addon uses N-API**, and therefore is ABI-compatible across different
Node.js versions. Addon binaries are precompiled and **there is no compilation**
step during the `npm install` command.

## Binary Origin

Release archives are built by this repository's public GitHub Actions workflows.

Attestations: https://github.com/node-3d/iohook/attestations

To verify a downloaded archive:

```bash
gh release download <tag> -R node-3d/iohook -p <platform>.gz
gh attestation verify <platform>.gz -R node-3d/iohook
```

# Node.js IO hook

This is a part of [Node3D](https://github.com/node-3d) project.

[![NPM](https://badge.fury.io/js/@node-3d%2Fiohook.svg)](https://badge.fury.io/js/@node-3d/iohook)
[![Lint](https://github.com/node-3d/iohook/actions/workflows/lint.yml/badge.svg)](https://github.com/node-3d/iohook/actions/workflows/lint.yml)
[![Test](https://github.com/node-3d/iohook/actions/workflows/test.yml/badge.svg)](https://github.com/node-3d/iohook/actions/workflows/test.yml)
[![Cpplint](https://github.com/node-3d/iohook/actions/workflows/cpplint.yml/badge.svg)](https://github.com/node-3d/iohook/actions/workflows/cpplint.yml)

```console
npm install @node-3d/iohook
```

## Binary Provenance

Release binary archives for this package are published by public GitHub Actions
workflows.
When a release asset includes a GitHub Artifact Attestation, you can verify that
the downloaded archive was published by the visible workflow in this repository:

```console
gh release download <tag> -R node-3d/iohook -p <platform>.gz
gh attestation verify <platform>.gz -R node-3d/iohook
```

The attestation links the archive to the repository, workflow, commit, and
release build identity. It does not replace review of the source code, workflow,
or third-party library contents.

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

iohook.start();
```

> Note: this **addon uses N-API**, and therefore is ABI-compatible across different
Node.js versions. Addon binaries are precompiled and **there is no compilation**
step during the `npm install` command.
